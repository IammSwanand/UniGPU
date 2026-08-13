import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import FAQSection from '../components/landing/FAQSection';
import FooterSection from '../components/landing/FooterSection';

export default function FAQ() {
    return (
        <div className="landing-page">
            <Navbar />
            
            <main id="main-content" style={{ paddingTop: '80px', minHeight: 'calc(100vh - 300px)' }}>
                <FAQSection showBackButton={true} />
            </main>

            <FooterSection />
        </div>
    );
}
