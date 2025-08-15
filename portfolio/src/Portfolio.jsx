import React from "react";
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './portfolio.css';

function Portfolio() {
    return (
        <BrowserRouter>
            <div className="navbar">
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/about">About</Link></li>
                    <li><Link to="/academics">Academics</Link></li>
                    <li><Link to="/skills">Skills</Link></li>
                </ul>
            </div>

            {/* Main content area */}
            <div className="main-content">
                {/* Your main portfolio content goes here */}
                <Routes>
                    <Route path="/" element={<div>Home Section</div>} />
                    <Route path="/about" element={<div>About Section</div>} />
                    <Route path="/academics" element={<div>Academics Section</div>} />
                    <Route path="/skills" element={<div>Skills Section</div>} />
                </Routes>
            </div>

            <div className="footer ">
                <p>For More Info </p>
            </div >
        </BrowserRouter>
    );
}

export default Portfolio;

