import { Component, useEffect, useState, type ReactElement, type ReactNode } from "react";
import RedirectToStaffSignIn from "@shared/RedirectToStaffSignIn";
import { Navigate, Route, Routes } from "react-router-dom";
import { askServerAboutHr, type HrState } from "@counselor/lib/hr";
import { AuthProvider } from "@counselor/context/AuthContext";
import { RequireAuth } from "@counselor/components/RequireAuth";
import Auth from "@counselor/pages/Auth";
import NotFound from "@counselor/pages/NotFound";
import CounselorLayout from "@counselor/counselor/CounselorLayout";
import CounselorHome from "@counselor/counselor/CounselorHome";
import MyLeads from "@counselor/counselor/MyLeads";
import MyStudents from "@counselor/counselor/MyStudents";
import Shortlists from "@counselor/counselor/Shortlists";
import CaseInbox from "@shared/components/CaseInbox";
import { WhatsAppLeadsChat, WhatsAppStudentsChat } from "@counselor/counselor/WhatsAppChat";
import Documents from "@counselor/counselor/Documents";
import DocumentsSetup from "@counselor/counselor/DocumentsSetup";
import Applications from "@counselor/counselor/Applications";
import {
  AttendancePage,
  CounselorProfile,
  LeavePage,
  NotificationsPage,
  SalaryPage,
} from "@counselor/counselor/AccountPages";
import StudentChecklist from "@counselor/counselor/StudentChecklist";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: "" };

  static getDerivedStateFromError(error: Error) {
    return { error: error.message || "Something went wrong" };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6 text-white">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold">The page failed to load</h1>
            <p className="mt-2 text-sm text-slate-300">{this.state.error}</p>
            <button
              className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-navy-950"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Opens an HR page only when the server says HR is on - the same single answer the sidebar uses, so a
 * tab can never lead to a redirect or a hidden tab hide a page that would have worked.
 *
 * While the answer is still coming it renders nothing rather than redirecting: bouncing someone to
 * the dashboard because a request had not finished yet would look exactly like the feature being off.
 */
function HrRoute({ children }: { children: ReactElement }) {
  const [hr, setHr] = useState<HrState>("unknown");
  const [asked, setAsked] = useState(false);
  useEffect(() => {
    let alive = true;
    void askServerAboutHr().then((answer) => {
      if (!alive) return;
      setHr(answer);
      setAsked(true);
    });
    return () => { alive = false; };
  }, []);
  if (!asked) return null;
  return hr === "on" ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <>
        <Routes>
          {/* one staff door: /staff */}
          <Route path="/login" element={<RedirectToStaffSignIn />} />
          <Route path="/auth" element={<RedirectToStaffSignIn />} />

          <Route
            path="/"
            element={
              <RequireAuth roles={["counselor"]}>
                <CounselorLayout />
              </RequireAuth>
            }
          >
            <Route index element={<CounselorHome />} />
            <Route path="leads" element={<MyLeads />} />
            <Route path="students" element={<MyStudents />} />
            <Route path="shortlists" element={<Shortlists />} />
            <Route path="chat" element={<CaseInbox title="Student Chat" />} />
            <Route path="whatsapp" element={<Navigate to="/whatsapp/students" replace />} />
            <Route path="whatsapp/leads" element={<WhatsAppLeadsChat />} />
            <Route path="whatsapp/students" element={<WhatsAppStudentsChat />} />
            <Route path="checklists" element={<StudentChecklist />} />
            <Route path="documents" element={<Documents />} />
            <Route path="documents/setup" element={<DocumentsSetup />} />
            <Route path="applications" element={<Applications />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<CounselorProfile />} />
            <Route path="leave" element={<HrRoute><LeavePage /></HrRoute>} />
            <Route path="attendance" element={<HrRoute><AttendancePage /></HrRoute>} />
            <Route path="salary" element={<HrRoute><SalaryPage /></HrRoute>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
    </AuthProvider>
    </ErrorBoundary>
  );
}
