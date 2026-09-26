import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Sales from "./pages/Sales";
import Accounting from "./pages/Accounting";
import BusinessSettings from "./pages/BusinessSettings";
import Register from "./pages/Register";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<Login />} />

                <Route path="/register" element={<Register />} />

                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/customers" element={<Customers />} />

                <Route path="/suppliers" element={<Suppliers />} />

                <Route path="/inventory" element={<Inventory />} />

                <Route path="/sales" element={<Sales />} />

                <Route path="/purchases" element={<Purchases />} />

                <Route path="/expenses" element={<Expenses />} />

                <Route path="/accounting" element={<Accounting />} />

                <Route path="/reports" element={<Reports />} />

                <Route
                    path="/business-settings"
                    element={<BusinessSettings />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;