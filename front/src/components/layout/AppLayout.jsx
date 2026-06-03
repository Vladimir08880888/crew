import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';

export function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
