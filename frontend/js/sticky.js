window.addEventListener("scroll", function () {
        const nav = document.getElementById("header-nav-menu");
        const offset = nav.offsetTop;

        if (window.scrollY > offset) {
          nav.classList.add("navbar-sticky-in");
        } else {
          nav.classList.remove("navbar-sticky-in");
        }
      });