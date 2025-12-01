/*------------------------------------------------------------------
* Project:        Royalheart - NonProfit Fundraising Charity HTML Template
* Author:         HtmlDesignTemplates
* URL:            https://themeforest.net/user/htmldesigntemplates
* Created:        09/14/2025
-------------------------------------------------------------------*/


(function ($) {
  "use strict";

  /*//For Popup search start//*/
  $('a[href="#search1"]').on('click', function(event) {
    event.preventDefault();
    $('#search1').addClass('open');
    $('#search1 input').focus(); // Focus on the input field
  });

  $('#search1, #search1 button.close').on('click keyup', function(event) {
    if (event.target == this || $(event.target).hasClass('close') || event.keyCode == 27) {
      $('#search1').removeClass('open');
    }
  });

  /* SlickNav Responsive Menu */
  $('#responsive-menu').slicknav({
    duration: 500,
    easingOpen: 'easeInExpo',
    easingClose: 'easeOutExpo',
    closedSymbol: '<i class="arrow-indicator fa fa-angle-down"></i>',
    openedSymbol: '<i class="arrow-indicator fa fa-angle-up"></i>',
    prependTo: '#slicknav-mobile',
    allowParentLinks: true,
    label: ""
  });

  /* Dropdown Menu */
  var selected = $('#navbar li');
  selected.on("mouseenter", function () {
      $(this).find('ul').first().stop(true, true).delay(350).slideDown(500, 'easeInOutQuad');
  }).on("mouseleave", function () {
      $(this).find('ul').first().stop(true, true).delay(100).slideUp(150, 'easeInOutQuad');
  });

  /* Arrow Indicator for Submenus */
  if ($(window).width() > 992) {
      $(".navbar-arrow ul ul > li").has("ul").children("a").append("<i class='arrow-indicator fa fa-angle-right'></i>");
  }
  
   /* Counter for progress bar start */
  let valueDisplayss = document.querySelectorAll(".progress-num");
  let intervall = 3000;

  valueDisplayss.forEach((valueDisplay) => {
      let startValue = 0;
      let endValue = parseInt(valueDisplay.getAttribute("data-val"));
      let duration = Math.floor(intervall / endValue);
      let counter = setInterval(function() {
          startValue += 1;
          valueDisplay.textContent = startValue;
          if (startValue == endValue) {
              clearInterval(counter);
          }
      }, duration);
  });

  /* Counter for progress bar start */

  /* Sticky Header */
  let $headerMenu = $('.header-nav-menu');

    $(window).on('scroll', function () {
        let curScroll = $(window).scrollTop();

        if (curScroll > 80) {
            $headerMenu.addClass('navbar-sticky-in');
        } else {
            $headerMenu.removeClass('navbar-sticky-in');
        }
    });


  // Slick Slider //

  // Banner Slider
  $('.banner-slider').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    dots: false,
  });

  $('.testimonial-slider').slick({
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    dots: false,
    responsive: [
      { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } }
    ]
  });

  $('.gallery-slider').slick({
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    dots: false,
    responsive: [
      { breakpoint: 1100, settings: { slidesToShow: 3, slidesToScroll: 1 } },
      { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ]
  });

  $('.gallery-slider1').slick({
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    dots: false,
    responsive: [
      { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } }
    ]
  });

  $('.donator-slider').slick({
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    dots: false,
    responsive: [
      { breakpoint: 1100, settings: { slidesToShow: 5, slidesToScroll: 1 } },
      { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ]
  });

  $('.testimonial-slider1').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    dots: false,
  });

  $('.testimonial-slider2').slick({
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    dots: false,
    responsive: [
      { breakpoint: 1100, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ]
  });

  $('.testimonial-slider3').slick({
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    dots: false,
    responsive: [
      { breakpoint: 1100, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 900, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ]
  });

  $('.partner-slider').slick({
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    dots: false,
    responsive: [
      { breakpoint: 1100, settings: { slidesToShow: 5, slidesToScroll: 1 } },
      { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ]
  });

   $('.partner-slider1').slick({
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    dots: false,
    responsive: [
      { breakpoint: 1100, settings: { slidesToShow: 4, slidesToScroll: 1 } },
      { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ]
  });

  
  // Light Gallery
  lightGallery(document.getElementById('lightgallery'), {
    plugins: [lgVideo],
    speed: 500,
  });

  document.querySelectorAll('.circular-progress').forEach(el => {
  let value = parseInt(el.getAttribute('data-progress'));
  let startValue = 0;
  let duration = 20; // smaller = faster
  let speed = 10; // ms interval

  let progressValue = el.querySelector('.progress-value');

  let progress = setInterval(() => {
    startValue++;
    progressValue.textContent = startValue + "%";
    el.style.background = `conic-gradient(#FF6D12 ${startValue * 3.6}deg, #e5e5e5 0deg)`;

    if (startValue >= value) {
      clearInterval(progress);
    }
  }, speed);
});

})(jQuery);
