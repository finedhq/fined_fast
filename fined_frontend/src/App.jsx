import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Hero from "./pages/Home/Hero";
import ArticlesPage from "./pages/ArticlesPage";
import ContactPage from "./pages/ContactPage";
import FeedbackPage from "./pages/FeedbackPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminArticleList from "./pages/AdminArticleList";
import AdminArticleForm from "./pages/AdminArticleForm";
import AdminNewsletter from "./pages/AdminNewsletter";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Hero />} />
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
