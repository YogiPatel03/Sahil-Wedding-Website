// Preload all slide images
function preloadSlideImages() {
  const imagesToPreload = [
    './images/Mobile1.jpg',
    './images/Mobile2.jpg',
    './images/Mobile3.jpg',
    './images/WarpSlide1Full.jpg',
    './images/warpSlide2Full.jpg',
    './images/warpSlide3Full.jpg'
  ];
  
  // Create an array to track loading
  const preloadedImages = [];
  
  // Preload each image
  imagesToPreload.forEach(src => {
    const img = new Image();
    img.onload = function() {
      console.log(`Preloaded: ${src}`);
    };
    img.src = src;
    preloadedImages.push(img);
  });
  
  console.log('Started preloading all slide images');
}

// Call preload function when page loads
window.addEventListener('load', preloadSlideImages);

// Track ongoing slide transitions
let slideTransitionInProgress = false;
let transitionTimeouts = [];
let lastRequestedSlide = null;

// Initialize slide index at load
let currentSlideIndex = 0;

// Clear all transition timeouts
const clearTransitionTimeouts = () => {
    transitionTimeouts.forEach(timeout => clearTimeout(timeout));
    transitionTimeouts = [];
};

// toggles background active with improved transition handling
const slideNavigator = name => {
    // Store the last requested slide to prevent race conditions
    lastRequestedSlide = name;
    
    // Get all slides and specific targets
    let slides = document.querySelectorAll('.bg-slide');
    const nextSlide = document.querySelector(`.bg-slide.${name}`);
    
    if (!nextSlide) return; // Safety check
    
    // If already on this slide, do nothing
    if (nextSlide.classList.contains('active') && !slideTransitionInProgress) return;
    
    // If a transition is in progress, cancel it completely first
    if (slideTransitionInProgress) {
        clearTransitionTimeouts();
        
        // Hard reset the state of all slides
        slides.forEach(slide => {
            if (slide !== nextSlide) {
                // Clear all transition-related classes and styles
                slide.classList.remove('active', 'transition-active');
                slide.style = ''; // Reset all inline styles
                slide.style.display = 'none'; // Explicitly hide
            }
        });
    }
    
    // Mark transition in progress
    slideTransitionInProgress = true;
    document.body.classList.add('slide-transitioning');
    
    // Hide all UI elements during transition
    document.querySelectorAll('.wedding-date-location, .lead').forEach(el => {
        el.style.opacity = '0';
    });
    
    // Hide all other slides immediately
    slides.forEach(slide => {
        if (slide !== nextSlide) {
            slide.style.display = 'none';
            slide.classList.remove('active', 'transition-active');
        }
    });
    
    // Ensure next slide is visible but transparent
    nextSlide.style.display = 'block';
    nextSlide.style.opacity = '0';
    
    // Add active class to target slide
    nextSlide.classList.add('active');
    
    // Simple, clean fade-in with minimal complexity
    setTimeout(() => {
        // Only proceed if this is still the requested slide
        if (lastRequestedSlide !== name) return;
        
        // Set a clean transition
        nextSlide.style.transition = 'opacity 0.4s ease-in';
        nextSlide.style.opacity = '1';
        
        // Show UI elements after slide is visible
        setTimeout(() => {
            // Only proceed if this is still the requested slide
            if (lastRequestedSlide !== name) return;
            
            document.querySelectorAll('.wedding-date-location, .lead').forEach(el => {
                el.style.transition = 'opacity 0.3s ease-in';
                el.style.opacity = '1';
            });
            
            // Mark transition as complete
            slideTransitionInProgress = false;
            document.body.classList.remove('slide-transitioning');
            
            // Reset inline transitions
            nextSlide.style.transition = '';
            document.querySelectorAll('.wedding-date-location, .lead').forEach(el => {
                el.style.transition = '';
            });
        }, 500);
    }, 50);
    
    // Safety fallback
    const fallbackTimeout = setTimeout(() => {
        // Reset everything to a clean state
        slideTransitionInProgress = false;
        document.body.classList.remove('slide-transitioning');
        
        // Ensure only the target slide is active and visible
        slides.forEach(slide => {
            if (slide === nextSlide) {
                slide.classList.add('active');
                slide.style.opacity = '1';
                slide.style.display = 'block';
            } else {
                slide.classList.remove('active', 'transition-active');
                slide.style.opacity = '0';
                slide.style.display = 'none';
            }
        });
        
        // Show UI elements
        document.querySelectorAll('.wedding-date-location, .lead').forEach(el => {
            el.style.opacity = '1';
            el.style.transition = '';
        });
    }, 1000);
    
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
    // Safety check - if no name is provided, do nothing
    if (!name) return;
    
    let sections = document.querySelectorAll('section');
    let header = document.querySelector('header');
    
    // Hide slide navigation for mobile when viewing sections
    const slideLoader = document.querySelector('.slide-loader');
    if (slideLoader) {
        slideLoader.style.display = 'none';
    }

    // Hide the banner (which contains all slides and their wedding date/countdown elements)
    const banner = document.querySelector('.banner');
    if (banner) {
        banner.style.visibility = 'hidden';
        banner.style.opacity = '0';
    }
    
    // Add transition class to body to trigger CSS rules
    document.body.classList.add('section-transition');

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

            // First, remove active class from ALL navigation buttons
            // This ensures only one button is active at a time
            navList.forEach(el => {
                el.classList.remove('active');
            });
            
            // Add active class to the clicked button
            this.classList.add('active');

            // Check if this is the home button
            const isHomeButton = this.getAttribute('href') === '/' && !this.getAttribute('data-target');

            // If it's the home button, call resetHeader and return
            if (isHomeButton) {
                resetHeader();
                return;
            }
            
            // Get the target section
            const targetSection = this.getAttribute('data-target');

            // Hide the banner when navigating to a section
            const banner = document.querySelector('.banner');
            if (banner) {
                banner.style.visibility = 'hidden';
                banner.style.opacity = '0';
            }
            
            // Add transition class to body to trigger CSS rules
            document.body.classList.add('section-transition');
            
            // Navigate to section
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
    
    // For all anchor tags that might be linking between sections
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Skip if this is a navigation button (they're handled above)
            if (this.classList.contains('nav-btn')) {
                return;
            }

            // Don't hide elements if clicking to return to homepage
            if (this.getAttribute('href') === '#' || this.getAttribute('href') === '') {
                return;
            }
            
            // Hide the banner when clicking links
            const banner = document.querySelector('.banner');
            if (banner) {
                banner.style.visibility = 'hidden';
                banner.style.opacity = '0';
            }
            
            // Add transition class to body
            document.body.classList.add('section-transition');
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
    
    // Remove transition class
    document.body.classList.remove('section-transition');
    
    // Show the banner (which contains all slides and their wedding date/countdown elements)
    const banner = document.querySelector('.banner');
    if (banner) {
        banner.style.visibility = '';
        banner.style.opacity = '';
    }
    
    // IMPORTANT: Reset all navigation button states
    // Remove 'active' class from all nav buttons
    const allNavButtons = document.querySelectorAll('.nav-btn');
    allNavButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Set only the home button as active
    const homeButton = document.querySelector('.nav-btn[href="/"]');
    if (homeButton) {
        homeButton.classList.add('active');
    }

    // Clear URL hash
    window.history.pushState(null, null, window.location.pathname);
};

// initial navigation
const initNavigation = () => {
    // Only proceed with navigation if we're on the homepage (no hash in URL)
    if (window.location.hash && window.location.hash !== '#') {
        return;
    }
    
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
        
        // Update all countdown elements in the DOM
        const countdownElements = [
            document.getElementById('countdown-days'),
            document.getElementById('countdown-days-2'),
            document.getElementById('countdown-days-3')
        ];
        
        countdownElements.forEach(element => {
            if (element) {
                element.textContent = days;
            }
        });
    };
    
    // Update countdown immediately and then daily
    updateCountdown();
    setInterval(updateCountdown, 1000 * 60 * 60 * 24); // Update daily
});

// Gallery functionality removed (no lightbox)

// Handle page load properly for direct section links
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're loading directly to a section (via URL hash)
    if (window.location.hash && window.location.hash !== '#') {
        // Hide the banner when loading to a section
        const banner = document.querySelector('.banner');
        if (banner) {
            banner.style.visibility = 'hidden';
            banner.style.opacity = '0';
        }
        
        // Add transition class
        document.body.classList.add('section-transition');
    } else {
        // We're on the homepage, make sure banner is visible
        const banner = document.querySelector('.banner');
        if (banner) {
            banner.style.visibility = '';
            banner.style.opacity = '';
        }
        
        // Remove transition class
        document.body.classList.remove('section-transition');
    }
    
    // Always check if any section is currently showing
    const anyVisibleSection = document.querySelector('section.section-show');
    if (anyVisibleSection) {
        // Hide the banner if a section is visible
        const banner = document.querySelector('.banner');
        if (banner) {
            banner.style.visibility = 'hidden';
            banner.style.opacity = '0';
        }
        
        // Add transition class
        document.body.classList.add('section-transition');
    }
});