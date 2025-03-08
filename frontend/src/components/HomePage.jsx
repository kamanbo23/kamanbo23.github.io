import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hoveredCard, setHoveredCard] = useState(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });
    
    // Smoothed scroll progress for parallax effects
    const smoothScrollProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Parallax transformations
    const heroOpacity = useTransform(smoothScrollProgress, [0, 0.1], [1, 0]);
    const heroScale = useTransform(smoothScrollProgress, [0, 0.1], [1, 0.98]);
    const featuresTranslateY = useTransform(smoothScrollProgress, [0.1, 0.3], [100, 0]);
    const featuresOpacity = useTransform(smoothScrollProgress, [0.1, 0.25], [0, 1]);
    const showcaseTranslateY = useTransform(smoothScrollProgress, [0.3, 0.5], [100, 0]);
    const showcaseOpacity = useTransform(smoothScrollProgress, [0.3, 0.45], [0, 1]);
    const testimonialsTranslateY = useTransform(smoothScrollProgress, [0.5, 0.7], [100, 0]);
    const testimonialsOpacity = useTransform(smoothScrollProgress, [0.5, 0.65], [0, 1]);
    const ctaTranslateY = useTransform(smoothScrollProgress, [0.7, 0.9], [50, 0]);
    const ctaOpacity = useTransform(smoothScrollProgress, [0.7, 0.8], [0, 1]);

    // Mouse parallax effect
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const mouseMoveHandler = (e) => {
        setMousePosition({
            x: e.clientX / window.innerWidth - 0.5,
            y: e.clientY / window.innerHeight - 0.5
        });
    };

    useEffect(() => {
        window.addEventListener('mousemove', mouseMoveHandler);
        return () => {
            window.removeEventListener('mousemove', mouseMoveHandler);
        };
    }, []);

    // Interactive particles animation
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        
        let animationFrameId;
        let particles = [];
        let targetParticles = [];
        const particleCount = 200;
        let mouseRadius = 100;
        let mousePos = { x: 0, y: 0 };

        // Handle mouse movement over canvas
        const handleCanvasMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        // Handle resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        // Initialize particles
        const initParticles = () => {
            particles = [];
            targetParticles = [];
            
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 1,
                    speedX: (Math.random() - 0.5) * 0.5,
                    speedY: (Math.random() - 0.5) * 0.5,
                    targetX: Math.random() * canvas.width,
                    targetY: Math.random() * canvas.height,
                    color: `hsla(${Math.random() * 60 + 210}, 100%, 70%, ${Math.random() * 0.4 + 0.2})`,
                    glowing: Math.random() > 0.9
                });
                
                targetParticles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height
                });
            }
        };

        // Animate particles
        const animate = () => {
            if (!ctx) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update and draw particles
            particles.forEach((particle, i) => {
                // Move towards target
                particle.x += (targetParticles[i].x - particle.x) * 0.01;
                particle.y += (targetParticles[i].y - particle.y) * 0.01;
                
                // Add small random movement
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                
                // Mouse repulsion
                const dx = mousePos.x - particle.x;
                const dy = mousePos.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouseRadius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (mouseRadius - distance) / mouseRadius;
                    
                    particle.x -= Math.cos(angle) * force * 2;
                    particle.y -= Math.sin(angle) * force * 2;
                }
                
                // Bounce off edges
                if (particle.x < 0 || particle.x > canvas.width) {
                    particle.speedX *= -1;
                }
                
                if (particle.y < 0 || particle.y > canvas.height) {
                    particle.speedY *= -1;
                }
                
                // Reset target if close enough
                const targetDist = Math.sqrt(
                    Math.pow(particle.x - targetParticles[i].x, 2) + 
                    Math.pow(particle.y - targetParticles[i].y, 2)
                );
                
                if (targetDist < 10) {
                    targetParticles[i] = {
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height
                    };
                }
                
                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.fill();
                
                // Draw connections to nearby particles
                particles.forEach((p2, j) => {
                    if (i === j) return;
                    
                    const dx = particle.x - p2.x;
                    const dy = particle.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(129, 140, 248, ${0.1 * (1 - distance/100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                });
                
                // Add glow effect for special particles
                if (particle.glowing) {
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
                    const gradient = ctx.createRadialGradient(
                        particle.x, particle.y, particle.size,
                        particle.x, particle.y, particle.size * 4
                    );
                    gradient.addColorStop(0, 'rgba(129, 140, 248, 0.5)');
                    gradient.addColorStop(1, 'rgba(129, 140, 248, 0)');
                    ctx.fillStyle = gradient;
                    ctx.fill();
                }
            });
            
            animationFrameId = window.requestAnimationFrame(animate);
        };

        // Set canvas dimensions and add event listeners
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        window.addEventListener('resize', handleResize);
        canvas.addEventListener('mousemove', handleCanvasMouseMove);
        
        // Initialize and start animation
        initParticles();
        animate();
        
        // Clean up
        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('mousemove', handleCanvasMouseMove);
            window.cancelAnimationFrame(animationFrameId);
        };
    }, []);  // Empty dependency array to run only once

    // Hero section animations
    const heroVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 10
            }
        }
    };

    // Feature card animations
    const featureCardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: 0.3 + (i * 0.1),
                duration: 0.6,
                ease: [0.215, 0.61, 0.355, 1]
            }
        }),
        hover: {
            y: -10,
            scale: 1.03,
            boxShadow: "0 20px 30px rgba(0, 0, 0, 0.15)",
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        }
    };

    // 3D card hover effect
    const calculateCardRotation = (e, cardElem) => {
        if (!cardElem) return { x: 0, y: 0 };
        
        const rect = cardElem.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Normalize coordinates to be between -1 and 1
        const x = (e.clientX - centerX) / (rect.width / 2);
        const y = (e.clientY - centerY) / (rect.height / 2);
        
        // Scale down rotation for subtle effect
        return { x: y * -5, y: x * 5 };
    };

    const features = [
        {
            id: "research",
            title: "Research Opportunities",
            description: "Discover cutting-edge research positions across leading institutions and companies, perfectly matched to your expertise and interests.",
            icon: (
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 9H7V11H9V9Z" fill="currentColor"/>
                    <path d="M13 9H11V11H13V9Z" fill="currentColor"/>
                    <path d="M17 9H15V11H17V9Z" fill="currentColor"/>
                    <path d="M9 13H7V15H9V13Z" fill="currentColor"/>
                    <path d="M17 13H11V15H17V13Z" fill="currentColor"/>
                    <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M20.5 20.5L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            ),
            color: "var(--color-primary)"
        },
        {
            id: "events",
            title: "Tech Events",
            description: "Stay connected with conferences, workshops, and meetups that expand your network and keep you at the cutting edge of innovation.",
            icon: (
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9 14L11 16L15 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
            color: "var(--color-accent)"
        },
        {
            id: "fellowships",
            title: "Fellowships & Grants",
            description: "Access exclusive funding opportunities tailored to your research field and career stage, from prestigious fellowships to specialized grants.",
            icon: (
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
            color: "var(--color-secondary)"
        }
    ];

    const testimonials = [
        {
            id: 1,
            content: "This platform revolutionized how I find research opportunities. The personalized matching algorithm connected me with my dream position at MIT!",
            author: "Sophie Chen",
            role: "PhD Candidate, Computer Science",
            avatar: "https://randomuser.me/api/portraits/women/32.jpg"
        },
        {
            id: 2,
            content: "Thanks to this platform, I discovered a fellowship that perfectly aligned with my research interests and career goals. The application process was seamless.",
            author: "Dr. James Wilson",
            role: "Postdoctoral Researcher, Biotech",
            avatar: "https://randomuser.me/api/portraits/men/57.jpg"
        },
        {
            id: 3,
            content: "The tech events section kept me informed about industry conferences that significantly expanded my professional network and knowledge base.",
            author: "Aisha Patel",
            role: "ML Engineer, Research Institute",
            avatar: "https://randomuser.me/api/portraits/women/45.jpg"
        }
    ];

    return (
        <div ref={containerRef} className="homepage">
            {/* Particle background */}
            <canvas ref={canvasRef} className="particle-canvas" />
            
            {/* Visual effects */}
            <div className="noise-overlay" />
            <div 
                className="glow-effect top-left" 
                style={{ 
                    transform: `translate(${mousePosition.x * -40}px, ${mousePosition.y * -40}px)` 
                }}
            />
            <div 
                className="glow-effect bottom-right" 
                style={{ 
                    transform: `translate(${mousePosition.x * 40}px, ${mousePosition.y * 40}px)` 
                }}
            />
            
            {/* Hero section */}
            <motion.section 
                className="hero-section"
                initial="hidden"
                animate="visible"
                variants={heroVariants}
                style={{ 
                    opacity: heroOpacity,
                    scale: heroScale,
                    y: useTransform(smoothScrollProgress, [0, 0.1], [0, 50])
                }}
            >
                <motion.h1 
                    className="hero-title"
                    variants={itemVariants}
                    style={{ 
                        x: mousePosition.x * -20,
                        y: mousePosition.y * -20
                    }}
                >
                    <span className="text-gradient-primary">Research</span> Opportunities{" "}
                    <span className="text-gradient-accent">&</span>{" "}
                    <span className="text-gradient-secondary">Events</span>
                </motion.h1>
                
                <motion.div 
                    className="hero-tagline-container"
                    variants={itemVariants}
                >
                    <p className="hero-tagline">
                        Connect with cutting-edge research, fellowships, and tech events that align perfectly with your expertise and ambitions.
                    </p>
                </motion.div>
                
                <motion.div 
                    className="hero-cta"
                    variants={itemVariants}
                >
                    <Link to="/opportunities" className="btn btn-primary btn-lg">
                        <span>Explore Opportunities</span>
                        <svg className="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </Link>
                    <Link to="/events" className="btn btn-ghost btn-lg">
                        <span>Browse Tech Events</span>
                        <svg className="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </Link>
                </motion.div>
                
                <motion.div 
                    className="hero-stats"
                    variants={itemVariants}
                >
                    <div className="stat">
                        <span className="stat-value">1,200+</span>
                        <span className="stat-label">Research Opportunities</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">500+</span>
                        <span className="stat-label">Tech Events</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">350+</span>
                        <span className="stat-label">Participating Institutions</span>
                    </div>
                </motion.div>
                
                <div className="scroll-indicator">
                    <span>Scroll to explore</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5L12 19M12 19L19 12M12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </motion.section>
            
            {/* Features section */}
            <motion.section 
                className="features-section"
                style={{ 
                    y: featuresTranslateY,
                    opacity: featuresOpacity 
                }}
            >
                <h2 className="section-title">Discover Opportunities</h2>
                <p className="section-subtitle">Find the perfect match for your academic and professional journey</p>
                
                <div className="features-grid">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.id}
                            className="feature-card"
                            custom={i}
                            initial="hidden"
                            whileInView="visible"
                            whileHover="hover"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={featureCardVariants}
                            onHoverStart={() => setHoveredCard(feature.id)}
                            onHoverEnd={() => setHoveredCard(null)}
                            onMouseMove={(e) => {
                                const elem = document.getElementById(`feature-${feature.id}`);
                                if (elem) {
                                    const { x, y } = calculateCardRotation(e, elem);
                                    elem.style.transform = `perspective(1000px) rotateX(${x}deg) rotateY(${y}deg)`;
                                }
                            }}
                            onMouseLeave={(e) => {
                                const elem = document.getElementById(`feature-${feature.id}`);
                                if (elem) {
                                    elem.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
                                }
                            }}
                            id={`feature-${feature.id}`}
                            style={{
                                borderTop: `3px solid ${feature.color}`
                            }}
                        >
                            <div className="feature-icon-container" style={{ color: feature.color }}>
                                {feature.icon}
                                <div className="feature-icon-glow" style={{ background: feature.color }}></div>
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                            <div className="feature-cta">
                                <Link to={feature.id === "research" || feature.id === "fellowships" ? "/opportunities" : "/events"} className="feature-link">
                                    <span>Learn more</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.section>
            
            {/* Showcase section */}
            <motion.section 
                className="showcase-section"
                style={{ 
                    y: showcaseTranslateY,
                    opacity: showcaseOpacity 
                }}
            >
                <div className="showcase-content">
                    <h2 className="section-title">How It Works</h2>
                    <div className="steps-container">
                        <motion.div 
                            className="step"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            viewport={{ once: true, amount: 0.5 }}
                        >
                            <div className="step-number">1</div>
                            <h3 className="step-title">Discover Opportunities</h3>
                            <p className="step-description">Browse curated research positions, grants, and fellowships perfectly matched to your interests.</p>
                        </motion.div>
                        
                        <motion.div 
                            className="step"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            viewport={{ once: true, amount: 0.5 }}
                        >
                            <div className="step-number">2</div>
                            <h3 className="step-title">Explore Events</h3>
                            <p className="step-description">Find conferences, workshops, and symposiums to expand your knowledge and professional network.</p>
                        </motion.div>
                        
                        <motion.div 
                            className="step"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            viewport={{ once: true, amount: 0.5 }}
                        >
                            <div className="step-number">3</div>
                            <h3 className="step-title">Connect & Collaborate</h3>
                            <p className="step-description">Network with peers, mentors, and research leaders in your field of interest.</p>
                        </motion.div>
                    </div>
                </div>
                
                <motion.div 
                    className="showcase-image"
                    initial={{ opacity:.0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    viewport={{ once: true, amount: 0.5 }}
                >
                    <div className="showcase-image-container">
                        <div className="platform-preview">
                            <div className="preview-header">
                                <div className="preview-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <div className="preview-title">Research Opportunities</div>
                            </div>
                            <div className="preview-body">
                                <div className="preview-card">
                                    <div className="preview-card-header">
                                        <div className="preview-tag">Fellowship</div>
                                        <h4>Quantum Computing Research Fellowship</h4>
                                    </div>
                                    <div className="preview-card-content">
                                        <div className="preview-meta">
                                            <span><i></i>MIT</span>
                                            <span><i></i>$75,000/year</span>
                                            <span><i></i>2 years</span>
                                        </div>
                                        <div className="preview-line"></div>
                                        <div className="preview-line-short"></div>
                                    </div>
                                </div>
                                <div className="preview-card preview-card-secondary">
                                    <div className="preview-card-header">
                                        <div className="preview-tag">Research Position</div>
                                        <h4>AI Ethics Research Program</h4>
                                    </div>
                                    <div className="preview-card-content">
                                        <div className="preview-meta">
                                            <span><i></i>Stanford</span>
                                            <span><i></i>Remote</span>
                                        </div>
                                        <div className="preview-line"></div>
                                        <div className="preview-line-short"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="preview-glow"></div>
                        </div>
                    </div>
                </motion.div>
            </motion.section>
            
            {/* Testimonials section */}
            <motion.section 
                className="testimonials-section"
                style={{ 
                    y: testimonialsTranslateY,
                    opacity: testimonialsOpacity 
                }}
            >
                <h2 className="section-title">Success Stories</h2>
                <p className="section-subtitle">Hear from researchers who found their perfect opportunity</p>
                
                <div className="testimonials-grid">
                    {testimonials.map((testimonial, i) => (
                        <motion.div
                            key={testimonial.id}
                            className="testimonial-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 * i }}
                            viewport={{ once: true, amount: 0.3 }}
                        >
                            <div className="testimonial-content">
                                <svg className="quote-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 11H6C4.89543 11 4 10.1046 4 9V7C4 5.89543 4.89543 5 6 5H8C9.10457 5 10 5.89543 10 7V11ZM10 11V13C10 15.2091 8.20914 17 6 17H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M20 11H16C14.8954 11 14 10.1046 14 9V7C14 5.89543 14.8954 5 16 5H18C19.1046 5 20 5.89543 20 7V11ZM20 11V13C20 15.2091 18.2091 17 16 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <p className="testimonial-text">{testimonial.content}</p>
                            </div>
                            <div className="testimonial-author">
                                <img src={testimonial.avatar} alt={testimonial.author} className="author-avatar" />
                                <div className="author-info">
                                    <h4 className="author-name">{testimonial.author}</h4>
                                    <p className="author-role">{testimonial.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.section>
            
            {/* CTA section */}
            <motion.section 
                className="cta-section"
                style={{ 
                    y: ctaTranslateY,
                    opacity: ctaOpacity 
                }}
            >
                <div className="cta-card animate-borderGlow">
                    <div className="cta-content">
                        <h2 className="cta-title">Ready to Advance Your Research Journey?</h2>
                        <p className="cta-description">
                            Join thousands of researchers who have discovered career-defining opportunities through our platform.
                        </p>
                        <div className="cta-buttons">
                            <Link to="/register" className="btn btn-primary btn-lg">
                                <span>Create Account</span>
                            </Link>
                        </div>
                    </div>
                    <div className="cta-decoration">
                        <div className="floating-shape shape-1"></div>
                        <div className="floating-shape shape-2"></div>
                        <div className="floating-shape shape-3"></div>
                    </div>
                </div>
            </motion.section>
        </div>
    );
};

export default HomePage; 