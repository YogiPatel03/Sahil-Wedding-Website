// toggles background active
const slideNavigator = name => {
    let slides = document.querySelectorAll('.bg-slide');
    slides.forEach(slide => {
        slide.classList.remove('active');
        if (slide.classList.contains(name)) {
            slide.classList.add('active');
        }
    });
};

// toggle mobile menu
const toggleMenu = () => {
    const menu = document.querySelector('.menu');
    const nav = document.querySelector('.nav');
    menu.classList.toggle('active');
    nav.classList.toggle('active');

    // Add a body class to prevent scrolling when menu is open
    document.body.classList.toggle('menu-open');
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
    slideBtnList.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            slideBtnList.forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
            slideNavigator(this.getAttribute('data-target'));
        });
    });
});

// activates sections
const sectionNavigator = name => {
    let sections = document.querySelectorAll('section');
    let header = document.querySelector('header');

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

    // Clear URL hash
    window.history.pushState(null, null, window.location.pathname);
};

// initial navigation
const initNavigation = () => {
    const navList = document.querySelectorAll('.nav-btn');
    navList.forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('data-target') === 'Story') {
            el.classList.add('active');
        }
    });
    sectionNavigator('Story');
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