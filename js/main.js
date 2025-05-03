// Track ongoing slide transitions
let slideTransitionInProgress = false;
let transitionTimeouts = [];

// Initialize slide index at load
let currentSlideIndex = 0;

// Clear all transition timeouts
const clearTransitionTimeouts = () => {
    transitionTimeouts.forEach(timeout => clearTimeout(timeout));
    transitionTimeouts = [];
};

// toggles background active with improved transition handling
const slideNavigator = name => {
    let slides = document.querySelectorAll('.bg-slide');
    
    // Find current active and next slide
    const currentActive = document.querySelector('.bg-slide.active');
    const nextSlide = document.querySelector(`.bg-slide.${name}`);
    
    if (currentActive === nextSlide) return; // Don't do anything if clicking the same slide
    
    // If a transition is in progress, clear all timeouts
    if (slideTransitionInProgress) {
        clearTransitionTimeouts();
        
        // Immediately complete any ongoing transitions
        slides.forEach(slide => {
            if (slide !== nextSlide) {
                slide.classList.remove('active');
                slide.style.opacity = '';
                slide.style.transition = '';
            }
        });
    }
    
    // Mark that we're starting a transition
    slideTransitionInProgress = true;
    
    // First fade out all slides except the target one
    slides.forEach(slide => {
        if (slide !== nextSlide) {
            // Set transition to 'out' state
            slide.style.transition = 'opacity 0.8s ease-out';
            slide.style.opacity = '0';
            
            // Remove active class after transition
            const timeout = setTimeout(() => {
                slide.classList.remove('active');
                slide.style.opacity = ''; // Reset inline style
                slide.style.transition = ''; // Reset inline style
            }, 800);
            
            transitionTimeouts.push(timeout);
        }
    });
    
    // Add active class to the target slide
    nextSlide.classList.add('active');
    
    // Ensure a smooth entrance animation
    requestAnimationFrame(() => {
        const timeout = setTimeout(() => {
            nextSlide.style.transition = 'opacity 1.2s ease-in';
            nextSlide.style.opacity = '1';
            
            // Mark transition as complete after animation finishes
            const completionTimeout = setTimeout(() => {
                slideTransitionInProgress = false;
            }, 1200);
            
            transitionTimeouts.push(completionTimeout);
        }, 50);
        
        transitionTimeouts.push(timeout);
    });
    
    // Safety fallback - ensure transition is marked complete after a maximum time
    const fallbackTimeout = setTimeout(() => {
        slideTransitionInProgress = false;
    }, 2500);
    
    transitionTimeouts.push(fallbackTimeout);
};

// toggle mobile menu
const toggleMenu = () => {
    const menu = document.querySelector('.menu');
    const nav = document.querySelector('.nav');
    menu.classList.toggle('active');
    nav.classList.toggle('active');

    // Add a body class to prevent scrolling when menu is open
    document.body.classList.toggle('menu-open');
    
    // Ensure accessibility
    if (nav.classList.contains('active')) {
        menu.setAttribute('aria-expanded', 'true');
        menu.setAttribute('aria-label', 'Close Menu');
    } else {
        menu.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-label', 'Open Menu');
    }
};

// Close menu when clicking outside of it
document.addEventListener('click', (e) => {
    const menu = document.querySelector('.menu');
    const nav = document.querySelector('.nav');

    // If menu is active and click is outside nav and menu button
    if (nav.classList.contains('active') &&
        !nav.contains(e.target) &&
        !menu.contains(e.target)) {
        toggleMenu();
    }
});

// Close menu when window is resized to desktop size
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        const nav = document.querySelector('.nav');
        if (nav.classList.contains('active')) {
            toggleMenu();
        }
    }
});

// toggle menu for mobile
window.addEventListener('load', () => {
    const menu = document.querySelector('.menu');
    menu.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu();
    });
});

// switch background for banner
window.addEventListener('load', () => {
    const slideBtnList = document.querySelectorAll(".slide-btn");
    
    // Enhanced click handling for mobile
    const handleSlideButtonClick = function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        
        // Get the index of this button
        const index = Array.from(slideBtnList).indexOf(this);
        currentSlideIndex = index;
        
        // Update UI
        slideBtnList.forEach(el => {
            el.classList.remove('active');
        });
        this.classList.add('active');
        
        // Trigger slide change
        slideNavigator(this.getAttribute('data-target'));
    };
    
    // Remove any existing event listeners first
    slideBtnList.forEach(btn => {
        btn.removeEventListener('click', handleSlideButtonClick);
        
        // Add the enhanced click handling
        btn.addEventListener('click', handleSlideButtonClick);
        
        // For mobile, also add touchend event
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            handleSlideButtonClick.call(this, e);
        });
    });
    
    // Debug log for mobile
    console.log("Slide buttons initialized: ", slideBtnList.length);
});

// activates sections
const sectionNavigator = name => {
    let sections = document.querySelectorAll('section');
    let header = document.querySelector('header');
    
    // Hide slide navigation for mobile when viewing sections
    const slideLoader = document.querySelector('.slide-loader');
    if (slideLoader) {
        slideLoader.style.display = 'none';
    }

    // Smooth scroll to top for mobile
    if (window.innerWidth <= 768) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    sections.forEach(section => {
        section.classList.remove('section-show');
        if (section.classList.contains(name)) {
            section.classList.add('section-show');
            header.classList.add('active');

            // Set focus to the section for accessibility
            setTimeout(() => {
                section.setAttribute('tabindex', '-1');
                section.focus({ preventScroll: true });
            }, 1000);
        }
    });
};

// naving to sections 
window.addEventListener('load', () => {
    const navList = document.querySelectorAll('.nav-btn');

    navList.forEach(nav => {
        nav.addEventListener('click', function (e) {
            e.preventDefault();

            // Don't do anything if it's already active
            if (this.classList.contains('active')) {
                return;
            }

            navList.forEach(el => {
                el.classList.remove('active');
            });

            this.classList.add('active');
            const targetSection = this.getAttribute('data-target');
            sectionNavigator(targetSection);

            // If on mobile and menu is open, close it
            if (window.innerWidth <= 768 &&
                document.querySelector('.nav').classList.contains('active')) {
                toggleMenu();
            }

            // Update URL hash for better navigation
            if (targetSection) {
                window.history.pushState(null, null, `#${targetSection}`);
            }
        });
    });

    // Check if URL has a hash on page load
    if (window.location.hash) {
        const targetSection = window.location.hash.substring(1);
        const targetNav = document.querySelector(`.nav-btn[data-target="${targetSection}"]`);

        if (targetNav) {
            // Simulate click on the nav button
            targetNav.click();
        }
    }
});

// resets header
const resetHeader = () => {
    let header = document.querySelector('header');
    header.classList.remove('active');

    // Reset all sections
    let sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.remove('section-show');
    });
    
    // Show slide navigation when returning to home
    const slideLoader = document.querySelector('.slide-loader');
    if (slideLoader) {
        slideLoader.style.display = '';
    }

    // Clear URL hash
    window.history.pushState(null, null, window.location.pathname);
};

// initial navigation
const initNavigation = () => {
    const navList = document.querySelectorAll('.nav-btn');
    navList.forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('data-target') === 'Bride&Groom') {
            el.classList.add('active');
        }
    });
    sectionNavigator('Bride&Groom');
};

// Add responsive image loading
window.addEventListener('load', () => {
    // Function to handle lazy loading of images
    const lazyLoadImages = () => {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    };

    // Handle loading images based on connection speed
    if ('connection' in navigator && navigator.connection.saveData) {
        // If data saver is enabled, delay loading non-essential images
        window.addEventListener('scroll', lazyLoadImages, { once: true });
    } else {
        // Otherwise load all images
        lazyLoadImages();
    }

    // Ensure content fits viewport on mobile
    const adjustContentHeight = () => {
        if (window.innerWidth <= 768) {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
    };

    adjustContentHeight();
    window.addEventListener('resize', adjustContentHeight);
});

// Wedding Countdown
window.addEventListener('load', () => {
    const updateCountdown = () => {
        const weddingDate = new Date('August 31, 2025 00:00:00').getTime();
        const now = new Date().getTime();
        const difference = weddingDate - now;
        
        // Calculate days
        const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
        
        // Update the countdown in the DOM
        const countdownElement = document.getElementById('countdown-days');
        if (countdownElement) {
            countdownElement.textContent = days;
        }
    };
    
    // Update countdown immediately and then daily
    updateCountdown();
    setInterval(updateCountdown, 1000 * 60 * 60 * 24); // Update daily
});

// Gallery functionality removed (no lightbox)