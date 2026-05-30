import React from 'react'
import { FOOTER_CONTENT } from '../pages/categoryConfig'
import './Footer.css'

function Footer({ currentCategory }) {
  const content = FOOTER_CONTENT[currentCategory] || FOOTER_CONTENT.risk

  return (
    <footer className="inform-footer" style={{ borderTopColor: content.color }}>
      <div className="footer-content">
        <div className="footer-section">
          <h3 style={{ color: content.color }}>{content.title}</h3>
          <p>{content.description}</p>
        </div>
        
        <div className="footer-section">
          <h4>Contacts</h4>
          <div className="contact-list">
            {content.contacts.map((contact, index) => (
              <div key={index} className="contact-item">
                {contact}
              </div>
            ))}
          </div>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <div className="links-list">
            {content.quickLinks.map((link, index) => (
              <a key={index} href="#" className="footer-link">
                {link}
              </a>
            ))}
          </div>
        </div>
        
        <div className="footer-section">
          <h4>INFORM Tanzania</h4>
          <div className="logo-section">
            <div className="tanzania-flag">🇹🇿</div>
            <p>Index For Risk Management</p>
            <p>Building Resilience Nationwide</p>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 INFORM Tanzania. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer