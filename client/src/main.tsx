
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Receiver from './components/Receiver.tsx'
import Sender from './components/Sender.tsx'
const router = createBrowserRouter([
  {
    path: "/sender",
    element: (
      <Sender />
    ),
  },
  {
    path: "/receiver",
    element: <Receiver />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);


