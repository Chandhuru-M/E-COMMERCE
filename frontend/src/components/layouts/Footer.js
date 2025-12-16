export default function Footer (){
    return (
        <footer className="py-3 mt-5">
            <div className="container">
                <div className="row">
                    <div className="col-md-4">
                        <h5>About AURA</h5>
                        <p>Your premium e-commerce platform for quality products and excellent service.</p>
                    </div>
                    <div className="col-md-4">
                        <h5>Quick Links</h5>
                        <ul style={{listStyle: 'none', padding: 0}}>
                            <li><a href="/">Home</a></li>
                            <li><a href="/products">Products</a></li>
                            <li><a href="/support">Support</a></li>
                        </ul>
                    </div>
                    <div className="col-md-4">
                        <h5>Contact Info</h5>
                        <p>Email: support@aura.com</p>
                        <p>Phone: +1 (555) 123-4567</p>
                    </div>
                </div>
                <hr style={{borderColor: 'var(--color-border)', margin: '20px 0'}} />
                <p className="text-center text-muted" style={{color: 'var(--color-text-tertiary)'}}>
                    AURA 2025-2026 © All Rights Reserved
                </p>
            </div>
        </footer>
    )
}