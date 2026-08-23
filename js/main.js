const canvas = document.getElementById('curtainCanvas');
const ctx = canvas.getContext('2d');
const clapperboard = document.getElementById('clapperboard');
const portfolio = document.getElementById('portfolio');
const contactInfo = document.getElementById('contactInfo');
const aboutMe = document.getElementById('aboutMe');
const zwjs = document.getElementById('zwjs');
const charImg = document.getElementById('charImg');
const workPage = document.getElementById('workPage');
const morePage = document.getElementById('morePage');
const moreBtn = document.getElementById('moreBtn');
const connectPage = document.getElementById('connectPage');
const connectClapperboard = document.getElementById('connectClapperboard');
const nav = document.getElementById('nav');
const navItems = document.querySelectorAll('.nav-item');
let width, height;
let animationId = null;
let isOpened = false;
let startTime = null;
let clapperTriggered = false;
// about页面内交互子状态
let currentState = 'initial';
// 当前导航页面：'About' | 'Works' | 'more' | 'Contact'
let currentPage = 'About';
// 动画总时长（毫秒）
const LIFT_DELAY = 400;
const OPEN_DURATION = 1800;
const TOTAL_DURATION = LIFT_DELAY + OPEN_DURATION;
const CLAPPER_DROP_DURATION = 1600;
const FLAP_TRANSITION_DURATION = 400;
// 帘子配置
const config = {
    gapXRatio: 0.72,
    gapTopWidth: 2,
    gapBottomWidth: 80,
    curtainColor: '#ffffff',
    liftHeight: 60,
    curveIntensity: 0.35
};
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    if (!isOpened) {
        drawCurtains(0);
    } else {
        drawCurtains(1);
    }
}
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function drawCurtains(progress) {
    ctx.clearRect(0, 0, width, height);
    const gapCenterX = width * config.gapXRatio;
    
    let liftProgress = 0;
    let openProgress = 0;
    if (progress < LIFT_DELAY / TOTAL_DURATION) {
        const t = progress / (LIFT_DELAY / TOTAL_DURATION);
        liftProgress = easeOutCubic(t);
    } else {
        liftProgress = 1;
        const t = (progress - LIFT_DELAY / TOTAL_DURATION) / (OPEN_DURATION / TOTAL_DURATION);
        openProgress = easeInOutCubic(t);
    }
    const openOffset = openProgress * width * 0.6;
    drawLeftCurtain(gapCenterX, liftProgress, openOffset);
    drawRightCurtain(gapCenterX, openOffset);
}
function drawLeftCurtain(gapCenterX, liftProgress, openOffset) {
    const topGap = config.gapTopWidth / 2;
    const bottomGap = config.gapBottomWidth / 2;
    const liftOffset = liftProgress * config.liftHeight;
    const moveX = -openOffset * 0.9;
    ctx.fillStyle = config.curtainColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(gapCenterX - topGap + moveX, 0);
    const ctrl1X = gapCenterX - bottomGap * 0.3 + moveX;
    const ctrl1Y = height * config.curveIntensity;
    const endX = gapCenterX - bottomGap + moveX;
    const endY = height - liftOffset;
    ctx.bezierCurveTo(
        gapCenterX - topGap + moveX, height * 0.15,
        ctrl1X, ctrl1Y,
        endX, endY
    );
    if (liftProgress > 0) {
        const bottomCtrlX = gapCenterX - bottomGap * 2 + moveX;
        const bottomCtrlY = height - liftOffset * 0.5;
        ctx.quadraticCurveTo(bottomCtrlX, bottomCtrlY, 0, height);
    } else {
        ctx.lineTo(0, height);
    }
    ctx.closePath();
    ctx.fill();
    addCurtainShadow(gapCenterX - topGap + moveX, 0, endX, endY, 'left');
}
function drawRightCurtain(gapCenterX, openOffset) {
    const topGap = config.gapTopWidth / 2;
    const bottomGap = config.gapBottomWidth / 2;
    const moveX = openOffset;
    ctx.fillStyle = config.curtainColor;
    ctx.beginPath();
    ctx.moveTo(width, 0);
    ctx.lineTo(gapCenterX + topGap + moveX, 0);
    const ctrl1X = gapCenterX + bottomGap * 0.3 + moveX;
    const ctrl1Y = height * config.curveIntensity;
    const endX = gapCenterX + bottomGap + moveX;
    const endY = height;
    ctx.bezierCurveTo(
        gapCenterX + topGap + moveX, height * 0.2,
        ctrl1X, ctrl1Y,
        endX, endY
    );
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    addCurtainShadow(gapCenterX + topGap + moveX, 0, endX, endY, 'right');
}
function addCurtainShadow(x1, y1, x2, y2, side) {
    const gradient = ctx.createLinearGradient(
        side === 'left' ? x1 : x1 - 30,
        y1,
        side === 'left' ? x1 + 30 : x1,
        y1
    );
    
    if (side === 'left') {
        gradient.addColorStop(0, 'rgba(0,0,0,0.08)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
    } else {
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.06)');
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    if (side === 'left') {
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1, height * 0.2, x2 - 20, height * 0.6, x2, y2);
        ctx.lineTo(x2 + 30, y2);
        ctx.bezierCurveTo(x2 + 10, height * 0.5, x1 + 30, height * 0.15, x1 + 30, y1);
    } else {
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1, height * 0.2, x2 + 20, height * 0.6, x2, y2);
        ctx.lineTo(x2 - 30, y2);
        ctx.bezierCurveTo(x2 - 10, height * 0.5, x1 - 30, height * 0.15, x1 - 30, y1);
    }
    
    ctx.closePath();
    ctx.fill();
}
function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / TOTAL_DURATION, 1);
    drawCurtains(progress);
    if (progress >= 1 && !clapperTriggered) {
        clapperTriggered = true;
        clapperboard.classList.add('active');
        canvas.style.pointerEvents = 'none';
        setTimeout(() => {
            if (currentPage === 'About') {
                showAboutMe();
            }
        }, CLAPPER_DROP_DURATION);
    }
    if (progress < 1) {
        animationId = requestAnimationFrame(animate);
    }
}
function showAboutMe() {
    aboutMe.classList.add('visible');
    currentState = 'aboutMe';
}
function hideAboutMe() {
    aboutMe.classList.remove('visible');
}
function onClapperboardClick() {
    if (currentPage !== 'About' || currentState !== 'aboutMe') return;
    
    clapperboard.classList.add('closed');
    hideAboutMe();
    
    setTimeout(() => {
        zwjs.classList.add('visible');
        charImg.classList.add('visible');
        currentState = 'zwjs';
    }, FLAP_TRANSITION_DURATION * 0.5);
}
function onBackgroundClick() {
    if (currentPage !== 'About' || currentState !== 'zwjs') return;
    
    zwjs.classList.remove('visible');
    charImg.classList.remove('visible');
    
    clapperboard.classList.remove('closed');
    
    setTimeout(() => {
        showAboutMe();
    }, FLAP_TRANSITION_DURATION * 0.5);
}
function updateNavActive(page) {
    navItems.forEach(item => {
        if (item.dataset.page === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}
function switchPage(page) {
    if (page === currentPage) return;
    currentPage = page;
    updateNavActive(page);
    if (page === 'About') {
        workPage.classList.remove('active');
        morePage.classList.remove('active');
        connectPage.classList.remove('active');
        zwjs.classList.remove('visible');
        charImg.classList.remove('visible');
        clapperboard.classList.remove('closed');
        setTimeout(() => {
            showAboutMe();
        }, FLAP_TRANSITION_DURATION * 0.5);
    } else if (page === 'Works') {
        workPage.classList.add('active');
        morePage.classList.remove('active');
        connectPage.classList.remove('active');
        hideAboutMe();
        zwjs.classList.remove('visible');
        charImg.classList.remove('visible');
        currentState = 'initial';
    } else if (page === 'more') {
        morePage.classList.add('active');
        workPage.classList.remove('active');
        connectPage.classList.remove('active');
        hideAboutMe();
        zwjs.classList.remove('visible');
        charImg.classList.remove('visible');
        currentState = 'initial';
    } else {
        // Contact页面
        workPage.classList.remove('active');
        morePage.classList.remove('active');
        connectPage.classList.add('active');
        hideAboutMe();
        zwjs.classList.remove('visible');
        charImg.classList.remove('visible');
        currentState = 'initial';
    }
}
function openCurtain() {
    if (isOpened) return;
    isOpened = true;
    
    portfolio.classList.add('hidden');
    contactInfo.classList.add('hidden');
    nav.classList.add('visible');
    updateNavActive('About');
    startTime = null;
    animationId = requestAnimationFrame(animate);
}
canvas.addEventListener('click', openCurtain);
clapperboard.addEventListener('click', function(e) {
    e.stopPropagation();
    onClapperboardClick();
});
zwjs.addEventListener('click', function(e) {
    e.stopPropagation();
});
navItems.forEach(item => {
    item.addEventListener('click', function(e) {
        e.stopPropagation();
        switchPage(this.dataset.page);
    });
});
moreBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    switchPage('more');
});
connectClapperboard.addEventListener('click', function(e) {
    e.stopPropagation();
    connectClapperboard.classList.toggle('closed');
});
document.addEventListener('click', function(e) {
    onBackgroundClick();
});
window.addEventListener('resize', resize);
resize();
// ==========画廊【路径修改 assets/Works】==========
function genImages(folder, count, ext) {
    ext = ext || 'jpg';
    const list = [];
    for (let i = 1; i <= count; i++) {
        list.push('assets/Works/' + folder + '/' + i + '.' + ext);
    }
    return list;
}
const galleryConfig = {
    5:  genImages('5', 3, 'png'),
    6:  genImages('6', 5, 'png'),
    7:  genImages('7', 7, 'png'),
    8:  genImages('8', 3, 'png'),
    9:  genImages('9', 6, 'png'),
    10: genImages('10', 4, 'png'),
};
const galleryOverlay = document.getElementById('galleryOverlay');
const galleryTrack = document.getElementById('galleryTrack');
const galleryDots = document.getElementById('galleryDots');
const galleryClose = document.getElementById('galleryClose');
const galleryPrev = document.getElementById('galleryPrev');
const galleryNext = document.getElementById('galleryNext');
let currentSlideIndex = 0;
let currentGalleryImages = [];
function openGallery(folderId) {
    const images = galleryConfig[folderId];
    if (!images || images.length === 0) {
        console.warn('文件夹 ' + folderId + ' 中没有配置图片，请检查 main.js 中的 galleryConfig');
        return;
    }
    currentGalleryImages = images;
    currentSlideIndex = 0;
    galleryTrack.innerHTML = '';
    images.forEach(function(src, index) {
        const slide = document.createElement('div');
        slide.className = 'gallery-slide';
        const img = document.createElement('img');
        img.src = src;
        img.alt = '图片 ' + (index + 1);
        img.onerror = function() {
            img.style.display = 'none';
            slide.innerHTML = '<span style="color:#888;font-size:14px;">图片加载失败：' + src + '</span>';
        };
        slide.appendChild(img);
        galleryTrack.appendChild(slide);
    });
    galleryDots.innerHTML = '';
    images.forEach(function(_, index) {
        const dot = document.createElement('div');
        dot.className = 'gallery-dot';
        dot.dataset.index = index;
        dot.addEventListener('click', function(e) {
            e.stopPropagation();
            goToSlide(index);
        });
        galleryDots.appendChild(dot);
    });
    goToSlide(0);
    galleryOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeGallery() {
    galleryOverlay.classList.remove('active');
    document.body.style.overflow = '';
}
function goToSlide(index) {
    const total = currentGalleryImages.length;
    if (total === 0) return;
    if (index < 0) index = total - 1;
    if (index >= total) index = 0;
    currentSlideIndex = index;
    galleryTrack.style.transform = 'translateX(-' + (index * 100) + '%)';
    const dots = galleryDots.querySelectorAll('.gallery-dot');
    dots.forEach(function(dot, i) {
        if (i === index) {
            dot.classList.add('active');
            dot.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
            dot.classList.remove('active');
        }
    });
}
function nextSlide() {
    goToSlide(currentSlideIndex + 1);
}
function prevSlide() {
    goToSlide(currentSlideIndex - 1);
}
document.querySelectorAll('.work-hover').forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.stopPropagation();
        const folderId = this.dataset.folder;
        openGallery(folderId);
    });
});
galleryClose.addEventListener('click', function(e) {
    e.stopPropagation();
    closeGallery();
});
galleryPrev.addEventListener('click', function(e) {
    e.stopPropagation();
    prevSlide();
});
galleryNext.addEventListener('click', function(e) {
    e.stopPropagation();
    nextSlide();
});
galleryOverlay.addEventListener('click', function(e) {
    if (e.target === galleryOverlay) {
        closeGallery();
    }
});
document.addEventListener('keydown', function(e) {
    if (!galleryOverlay.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') {
        prevSlide();
    } else if (e.key === 'ArrowRight') {
        nextSlide();
    } else if (e.key === 'Escape') {
        closeGallery();
    }
});
