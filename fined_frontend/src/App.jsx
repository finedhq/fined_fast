import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Hero from "./pages/Home/Hero";
import ArticlesPage from "./pages/Articles/ArticlesPage";
import Courses from "./pages/CoursesPage/Courses";
import ContactPage from "./pages/ContactPage/ContactPage";
import FeedbackPage from "./pages/FeedbackPage/FeedbackPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminArticleList from "./pages/Admin/AdminArticleList";
import AdminArticleForm from "./pages/Admin/AdminArticleForm";
import AdminNewsletter from "./pages/Admin/AdminNewsletter";
import CardViewer from "./pages/CoursesPage/CardViewer/CardViewer";
import AddCardForm from "./pages/Admin/AddCardForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Hero />} />
          <Route path="/courses/:courseId/module/:moduleId/card/:cardId" element={<CardViewer />} />
          <Route path="admin/cards/add" element={<AddCardForm />} />
          <Route path="courses" element={<Courses />} />
          <Route path="articles" element={<ArticlesPage />} />  
          <Route path="contact" element={<ContactPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/articles" element={<AdminArticleList />} />
          <Route path="admin/articles/add" element={<AdminArticleForm />} />
          <Route path="admin/newsletters" element={<AdminNewsletter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;