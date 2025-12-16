import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="amazon-footer mt-5">
            <div className="footer-main-section">
                <div className="container">
                    <div className="row">
                        <div className="col-md-4 col-sm-12 mb-4">
                            <h6 className="footer-heading">About AURA</h6>
                            <p className="footer-text">Your premium e-commerce platform for quality products and excellent service.</p>
                        </div>
                        <div className="col-md-4 col-sm-6 mb-4">
                            <h6 className="footer-heading">Quick Links</h6>
                            <ul className="footer-links">
                                <li><Link to="/">Home</Link></li>
                                <li><Link to="/products">Products</Link></li>
                                <li><Link to="/support">Support</Link></li>
                            </ul>
                        </div>
                        <div className="col-md-4 col-sm-6 mb-4">
                            <h6 className="footer-heading">Contact Info</h6>
                            <ul className="footer-links">
                                <li><span className="text-gray-400">Email:</span> support@aura.com</li>
                                <li><span className="text-gray-400">Phone:</span> +1 (555) 123-4567</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom-section">
                <div className="container text-center">
                    <div className="footer-logo-container mb-3">
                        <img src="/images/Auralogo.png" alt="Aura Logo" className="footer-logo" />
                    </div>
                    
                    <p className="copyright mt-2">AURA 2025-2026 © All Rights Reserved</p>
                </div>
            </div>
        </footer>
    );
}