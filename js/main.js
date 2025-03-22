// toggles background active
const slideNavigator = name => {
    let sldies = document.querySelectorAll('.bg-slide');
    sldies.forEach(slide => {
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
};

// toggle menu for mobile
window.addEventListener('load', () => {
    const menu = document.querySelector('.menu');
    menu.addEventListener('click', toggleMenu);
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
    sections.forEach(section => {
        section.classList.remove('section-show');
        if (section.classList.contains(name)) {
            section.classList.add('section-show');
            header.classList.add('active');
        }
    });
};

// naving to sections 
window.addEventListener('load', () => {
    const navList = document.querySelectorAll('.nav-btn');
    navList.forEach(nav => {
        nav.addEventListener ('click', function (e) {
            e.preventDefault();
            navList.forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
            sectionNavigator(this.getAttribute('data-target'));
            screen.width < 768 && toggleMenu();
        });
    });
});

// resets header
const resetHeader = () => {
    let header = document.querySelector('header');
    header.classList.remove('active');
};

// initial navigation
const initNavigation = () => {
    const navList = document.querySelectorAll('.nav-btn');
    navList.forEach(el =>{
        el.classList.remove('active');
        if (el.getAttribute('data-target') === 'Story') {
            el.classList.add('active');
        }
    });
    sectionNavigator('Story');
};