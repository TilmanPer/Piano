// Between 481px and 768px
if (window.matchMedia("(max-width: 768px)").matches) {
    keySlider.value = 36;
    rangeUpdate();
}

// Between 769px and 1024px
if (window.matchMedia("(min-width: 768px) and (max-width: 1483px)").matches) {
    keySlider.value = 24;
    rangeUpdate();
}

// Between 1025px and 1280px
if (window.matchMedia("(min-width: 1483px) and (max-width: 1950px)").matches) {
    keySlider.value = 12;
    rangeUpdate();
}

// Greater than or equal to 1281px
if (window.matchMedia("(min-width: 1950px)").matches) {
    keySlider.value = 0;
    rangeUpdate();
}
