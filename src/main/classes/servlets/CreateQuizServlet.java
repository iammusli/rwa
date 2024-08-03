package servlets;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import dao.QuizDAO;
import entities.Answer;
import entities.Question;
import entities.Quiz;
import entities.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import services.QuizService;
import utils.AnswerSerializer;
import utils.QuestionSerializer;
import utils.QuizSerializer;
import utils.UserSerializer;

import java.io.IOException;
import java.io.PrintWriter;

@WebServlet (name = "createQuizServlet", value = "/admin/quizzes/create")
public class CreateQuizServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private QuizService quizService;

    public CreateQuizServlet() {
        super();
        quizService = new QuizService(new QuizDAO());
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        Quiz quiz = new Quiz();
        Gson gson = new GsonBuilder()
                .registerTypeAdapter(Quiz.class, new QuizSerializer())
                .registerTypeAdapter(User.class, new UserSerializer())
                .registerTypeAdapter(Question.class, new QuestionSerializer())
                .registerTypeAdapter(Answer.class, new AnswerSerializer())
                .create();
        String json = gson.toJson(quiz);
        PrintWriter out = response.getWriter();
        out.println(json);
        out.flush();
        request.getRequestDispatcher("/createQuiz.jsp").forward(request, response);
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

    }
}
