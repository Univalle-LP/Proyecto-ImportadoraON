const welcomeMessage = document.getElementById('welcome-message');
if(welcomeMessage){
    setTimeout(() => {
        welcomeMessage.style.opacity = '0';
        setTimeout(() => {
            welcomeMessage.style.display = 'none';
        }, 500);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    // Año actual
    const yearElements = document.querySelectorAll('[data-current-year]');
    const currentYear = new Date().getFullYear();
    yearElements.forEach(el => {
        el.textContent = currentYear;
    });

    const buttons = document.querySelectorAll('.btn-gold, .btn-red, .nav-link-gold');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 8px rgba(255, 215, 0, 0.2)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
            button.style.boxShadow = '';
        });
    });

    // Menú desplegable del usuario
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenuBtn && userDropdown) {
        function toggleMenu() {
            const isOpen = userDropdown.classList.contains('opacity-100');
            if (isOpen) {
                userDropdown.classList.remove('opacity-100', 'visible', 'pointer-events-auto', 'scale-100');
                userDropdown.classList.add('opacity-0', 'invisible', 'pointer-events-none', 'scale-95');
                userMenuBtn.setAttribute('aria-expanded', 'false');
            } else {
                userDropdown.classList.add('opacity-100', 'visible', 'pointer-events-auto', 'scale-100');
                userDropdown.classList.remove('opacity-0', 'invisible', 'pointer-events-none', 'scale-95');
                userMenuBtn.setAttribute('aria-expanded', 'true');
            }
        }

        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Cerrar menú si se hace clic fuera
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('opacity-100', 'visible', 'pointer-events-auto', 'scale-100');
                userDropdown.classList.add('opacity-0', 'invisible', 'pointer-events-none', 'scale-95');
                userMenuBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Cerrar menú con tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                userDropdown.classList.remove('opacity-100', 'visible', 'pointer-events-auto', 'scale-100');
                userDropdown.classList.add('opacity-0', 'invisible', 'pointer-events-none', 'scale-95');
                userMenuBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }
});
