package entities;
import com.google.gson.Gson;
import dao.QuizDAO;
import jakarta.websocket.Session;
import services.QuizService;


import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

public class QuizRoom {
    private String quizPIN;
    private Quiz quiz;
    private boolean quizStarted = false;
    private List<Session> clientSessions;
    private Map<String, String> playerAnswers;
    private Map<String, Integer> playerPoints;
    private ScheduledExecutorService scheduler;
    private ScheduledFuture<?> questionTimer;
    private Iterator<Question> questionIterator;
    private Question currentQuestion;
    private int questionTimeLimit = 15;

    public QuizRoom(String quizPIN, int quizID){
        this.quizPIN = quizPIN;
        this.quiz = new QuizService(new QuizDAO()).getQuizById(quizID);
        this.clientSessions = new ArrayList<Session>();
        this.playerAnswers = new ConcurrentHashMap<>();
        this.playerPoints = new ConcurrentHashMap<>();
        this.scheduler = Executors.newScheduledThreadPool(1);
        this.questionIterator = quiz.getQuestions().iterator();
        this.currentQuestion = questionIterator.next();
    }

    public void startQuiz() {
        if (quiz != null) {
            quizStarted = true;
            broadcastMessage(new Message("The quiz has started!", MessageType.CHAT_MESSAGE.name(), "Server", quizPIN, true));
            currentQuestion();
        } else {
            broadcastMessage(new Message("Quiz not found.", MessageType.ERROR.name(), "Server", quizPIN, true));
        }
    }

    private void nextQuestion() {
        if (questionIterator.hasNext()) {
            currentQuestion = questionIterator.next();
            currentQuestion();
            startQuestionTimer();
        } else {
            sendResults();
            //endQuiz();
        }
    }

    private void sendResults() {
       /* playerPoints.forEach((player, points) -> {
            broadcastMessage(new Message(Integer.toString(points), MessageType.QUIZ_RESULTS.name(), player, quizPIN, true));
        }); */
        Gson gson = new Gson();
        broadcastMessage(new Message(gson.toJson(playerPoints), MessageType.QUIZ_RESULTS.name(), "Server", quizPIN, false));
    }

    public void currentQuestion(){
        if(currentQuestion != null){
            broadcastMessage(new Message(currentQuestion.getQuestion(), MessageType.QUESTION_BROADCAST.name(), "Server", quizPIN, false));
            Gson gson = new Gson();
            List<String> answers = new ArrayList<>();
            for(int i = 0; i < 4; ++i){
                answers.add(gson.toJson(currentQuestion.getAnswers().get(i).getAnswer_text()));
            }
            broadcastMessage(new Message(gson.toJson(answers), MessageType.ANSWERS_BROADCAST.name(), "Server", quizPIN, false));
            startQuestionTimer();
        }
    }

    private void startQuestionTimer() {
        if (questionTimer != null && !questionTimer.isDone()) {
            questionTimer.cancel(true);
        }
        questionTimer = scheduler.schedule(() -> {
            broadcastMessage(new Message("Time's up for this question!", MessageType.TIME_UP.name(), "Server", quizPIN, true));
            // Optionally handle automatic answer submission here if needed
        }, questionTimeLimit, TimeUnit.SECONDS);
    }

    public void submitAnswer(String playerId, String answer) {
        playerAnswers.put(playerId, answer);
        if (playerAnswers.size() == (clientSessions.size()-1)) {
            // All players have answered; move to the next question
            broadcastMessage(new Message("All answers are in!", MessageType.CHAT_MESSAGE.name(), "Server", quizPIN, true));
        }

        if(playerPoints.containsKey(playerId)){
            if(checkAnswer(Integer.parseInt(playerAnswers.get(playerId)))){
                playerPoints.put(playerId, playerPoints.get(playerId) + currentQuestion.getPoints());
            }
        } else {
            playerPoints.put(playerId, 0);
            if(checkAnswer(Integer.parseInt(playerAnswers.get(playerId)))){
                playerPoints.put(playerId, playerPoints.get(playerId) + currentQuestion.getPoints());
            }
        }
        broadcastMessage(new Message(Integer.toString(playerPoints.get(playerId)), MessageType.POINTS.name(), playerId, quizPIN, false));
    }

    public void skipQuestion() {
        broadcastMessage(new Message("Question skipped.", MessageType.CHAT_MESSAGE.name(), "Server", quizPIN, true));
        nextQuestion();
    }

    public void endQuiz() {
        broadcastMessage(new Message("Quiz has ended!", MessageType.CHAT_MESSAGE.name(), "Server", quizPIN, true));
        // Optionally send results here
        clientSessions.forEach(session -> {
            try {
                session.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
        scheduler.shutdown();
    }


    public String getQuizPIN() {
        return quizPIN;
    }
    public void addClientSession(Session session){
        this.clientSessions.add(session);
    }
    public void removeClientSession(Session session){
        this.clientSessions.remove(session);
    }
    public List<Session> getClientSessions() {
        return clientSessions;
    }
    public void broadcastMessage(Message message){
        for(Session client : clientSessions){
            try {
                client.getBasicRemote().sendText(message.toJson());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void sendError(Session sender, String message){
        try{
            sender.getBasicRemote().sendText(new Message(message, MessageType.ERROR.name(), "SERVER", quizPIN, false).toJson());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public boolean checkAnswer(int choice) {
        if(choice == 4) return false;
        if(currentQuestion.getAnswers().get(choice).isCorrect())
            return true;
        else return false;
    }
}
