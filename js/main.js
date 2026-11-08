const canvas = document.getElementById('curtainCanvas');
const ctx = canvas.getContext('2d');
const clapperboard = document.getElementById('clapperboard');
const portfolio = document.getElementById('portfolio');
const contactInfo = document.getElementById('contactInfo');
const aboutMe = document.getElementById('aboutMe');
const zwjs = document.getElementById('zwjs');
const charImg = document.getElementById('charImg');
const resumeDownload = document.getElementById('resumeDownload');
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

// 帘子基础配置（具体像素在resize中动态计算）
const config = {
    gapXRatio: 0.72,
    gapTopWidth: 2,
    gapBottomWidth: 80,
    curtainColor: '#ffffff',
    liftHeight: 60,
    curveIntensity: 0.35
};

// resize防抖计时器
let resizeTimer = null;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    // 修复Canvas高分屏模糊 + 避免缩放累积问题
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ========== 动态适配帘子参数 ==========
    // 横屏缝隙偏右（原设计），竖屏自动居中
    config.gapXRatio = width < height ? 0.5 : 0.72;
    // 底部缝隙宽度：视口宽度4%，限制40-120px
    config.gapBottomWidth = Math.min(Math.max(width * 0.04, 40), 120);
    // 帘子抬起高度：视口高度6%，限制30-80px
    config.liftHeight = Math.min(Math.max(height * 0.1, 30), 80);
    // 顶部缝隙：最小2px
    config.gapTopWidth = Math.max(2, width * 0.001);

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

    // 超宽屏自动缩小打开幅度，避免空白过大
    const openRatio = width > 2000 ? 0.5 : 0.6;
    const openOffset = openProgress * width * openRatio;

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
        resumeDownload.classList.add('visible');
        currentState = 'zwjs';
    }, FLAP_TRANSITION_DURATION * 0.5);
}

function onBackgroundClick() {
    if (currentPage !== 'About' || currentState !== 'zwjs') return;
    
    zwjs.classList.remove('visible');
    charImg.classList.remove('visible');
    resumeDownload.classList.remove('visible');
    
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

// 由下方轮播模块赋值，切页/尺寸变化时重新居中
let relayoutMoreCarousel = function () {};

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
        resumeDownload.classList.remove('visible');
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
        resumeDownload.classList.remove('visible');
        currentState = 'initial';
    } else if (page === 'more') {
        morePage.classList.add('active');
        relayoutMoreCarousel();
        workPage.classList.remove('active');
        connectPage.classList.remove('active');
        hideAboutMe();
        zwjs.classList.remove('visible');
        charImg.classList.remove('visible');
        resumeDownload.classList.remove('visible');
        currentState = 'initial';
    } else {
        // Contact页面
        workPage.classList.remove('active');
        morePage.classList.remove('active');
        connectPage.classList.add('active');
        hideAboutMe();
        zwjs.classList.remove('visible');
        charImg.classList.remove('visible');
        resumeDownload.classList.remove('visible');
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
// 简历下载按钮阻止冒泡
resumeDownload.addEventListener('click', function(e) {
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

// resize防抖监听
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
});

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
    11: genImages('11', 5, 'png'),
    12: genImages('12', 2, 'png'),
    13: genImages('13', 5, 'png'),
    14: genImages('14', 1, 'png'),
    15: genImages('15', 3, 'png'),
    16: genImages('16', 3, 'png'),
    17: genImages('17', 5, 'png'),
    18: genImages('18', 7, 'png'),
    19: genImages('19', 3, 'png'),
    20: genImages('20', 6, 'png'),
    21: genImages('21', 4, 'png'),
};
const galleryOverlay = document.getElementById('galleryOverlay');
const galleryTrack = document.getElementById('galleryTrack');
const galleryDots = document.getElementById('galleryDots');
const galleryClose = document.getElementById('galleryClose');
const galleryPrev = document.getElementById('galleryPrev');
const galleryNext = document.getElementById('galleryNext');
const galleryViewport = document.getElementById('galleryViewport');
let currentSlideIndex = 0;
let currentGalleryImages = [];
// 拖拽滑动相关变量
let isDragging = false;
let startDragX = 0;
let currentDragOffset = 0;

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
    isDragging = false;
    currentDragOffset = 0;
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

// ========== 画廊鼠标/触屏拖拽滑动 ==========
function handleDragStart(e) {
    if (!galleryOverlay.classList.contains('active')) return;
    isDragging = true;
    startDragX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    currentDragOffset = 0;
    galleryTrack.style.transition = 'none';
}
function handleDragMove(e) {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();
    const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    currentDragOffset = currentX - startDragX;
    const baseTranslate = -currentSlideIndex * 100;
    const percentOffset = (currentDragOffset / galleryViewport.offsetWidth) * 100;
    galleryTrack.style.transform = `translateX(${baseTranslate + percentOffset}%)`;
}
function handleDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    galleryTrack.style.transition = '';
    const threshold = galleryViewport.offsetWidth * 0.2; // 滑动阈值：视口宽度20%
    if (Math.abs(currentDragOffset) > threshold) {
        if (currentDragOffset > 0) {
            prevSlide();
        } else {
            nextSlide();
        }
    } else {
        goToSlide(currentSlideIndex); // 未达阈值则回弹
    }
    currentDragOffset = 0;
}
// 绑定拖拽事件（鼠标+触屏）
galleryViewport.addEventListener('mousedown', handleDragStart);
document.addEventListener('mousemove', handleDragMove);
document.addEventListener('mouseup', handleDragEnd);
document.addEventListener('mouseleave', handleDragEnd);
galleryViewport.addEventListener('touchstart', handleDragStart, { passive: true });
document.addEventListener('touchmove', handleDragMove, { passive: false });
document.addEventListener('touchend', handleDragEnd);

// 拖拽轮播期间置为 true，避免松手瞬间误触发画廊
let moreCarouselDragged = false;

// 绑定作品点击事件（包含 Works 页和 More 页所有 work-hover）
document.querySelectorAll('.work-hover').forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.stopPropagation();
        if (moreCarouselDragged) return;
        const folderId = this.dataset.folder;
        if (!folderId) return;
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

// ========== More 页胶卷卡片轮播（首尾相接的无限循环） ==========
(function () {
    const carousel = document.getElementById('moreCarousel');
    const track = document.getElementById('moreTrack');
    const counter = document.getElementById('moreCounter');
    const prevBtn = document.getElementById('morePrev');
    const nextBtn = document.getElementById('moreNext');
    if (!carousel || !track) return;

    const TRANSITION = 'transform 0.65s cubic-bezier(0.22, 0.61, 0.36, 1)';

    // 原始卡片（作品 11~21）
    const originals = Array.prototype.slice.call(track.querySelectorAll('.work-img'));
    const total = originals.length;
    if (!total) return;

    // 首、尾各复制一整套，让最后一张的右侧就是第一张，形成无缝循环
    function makeClone(node) {
        const clone = node.cloneNode(true);
        clone.classList.remove('is-active');
        clone.addEventListener('click', function (e) {
            e.stopPropagation();
            if (moreCarouselDragged) return;
            const folder = clone.dataset.folder;
            if (folder) openGallery(folder);
        });
        return clone;
    }

    const headFrag = document.createDocumentFragment();
    originals.forEach(function (card) { headFrag.appendChild(makeClone(card)); });
    track.insertBefore(headFrag, originals[0]);

    const tailFrag = document.createDocumentFragment();
    originals.forEach(function (card) { tailFrag.appendChild(makeClone(card)); });
    track.appendChild(tailFrag);

    // 轨道现在为 [复制套][原套][复制套]，从中间那套的第一张开始
    const cards = Array.prototype.slice.call(track.querySelectorAll('.work-img'));
    let index = total;
    let currentOffset = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragOriginOffset = 0;
    let dragLastDx = 0;
    let wheelLocked = false;

    function cardStep() {
        const gap = parseFloat(getComputedStyle(track).columnGap || 0) || 0;
        return cards[0].offsetWidth + gap;
    }

    function offsetFor(i) {
        const card = cards[i];
        return carousel.clientWidth / 2 - (card.offsetLeft + card.offsetWidth / 2);
    }

    function paint(animate) {
        currentOffset = offsetFor(index);
        track.style.transition = animate === false ? 'none' : TRANSITION;
        track.style.transform = 'translate3d(' + currentOffset + 'px, 0, 0)';
        cards.forEach(function (c, i) {
            c.classList.toggle('is-active', i === index);
        });
        if (counter) {
            const real = ((index % total) + total) % total;
            const pad = function (n) { return n < 10 ? '0' + n : String(n); };
            counter.textContent = pad(real + 1) + ' / ' + pad(total);
        }
    }

    // 滑出边界后，把索引平移回中间那套（画面完全等位，用户看不到跳动）
    function normalize() {
        let changed = false;
        while (index < total) { index += total; changed = true; }
        while (index >= total * 2) { index -= total; changed = true; }
        if (changed) paint(false);
    }

    track.addEventListener('transitionend', function (e) {
        if (e.target !== track || e.propertyName !== 'transform') return;
        normalize();
    });

    function go(i) {
        index = Math.max(0, Math.min(cards.length - 1, i));
        paint(true);
    }

    if (prevBtn) prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        go(index - 1);
    });
    if (nextBtn) nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        go(index + 1);
    });

    // 拖拽 / 滑动切换
    // 不做 setPointerCapture：一旦捕获，浏览器会把 click 派发到容器而非卡片，
    // 卡片就点不开画廊了。改为在 window 上监听 move/up。
    carousel.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true;
        dragStartX = e.clientX;
        dragOriginOffset = currentOffset;
        dragLastDx = 0;
        moreCarouselDragged = false;
        track.style.transition = 'none';
        carousel.classList.add('dragging');
    });

    window.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        const dx = e.clientX - dragStartX;
        dragLastDx = dx;
        if (Math.abs(dx) > 6) moreCarouselDragged = true;
        track.style.transform = 'translate3d(' + (dragOriginOffset + dx) + 'px, 0, 0)';
    });

    function endDrag() {
        if (!dragging) return;
        dragging = false;
        carousel.classList.remove('dragging');
        const step = cardStep();
        if (Math.abs(dragLastDx) > Math.max(40, step * 0.16)) {
            go(index + (dragLastDx < 0 ? 1 : -1));
        } else {
            paint(true);
        }
        if (moreCarouselDragged) {
            // 松手后浏览器还会派发一次 click，等它过去再解锁
            setTimeout(function () { moreCarouselDragged = false; }, 80);
        }
        dragLastDx = 0;
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // 滚轮翻卡
    carousel.addEventListener('wheel', function (e) {
        const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (Math.abs(d) < 12) return;
        e.preventDefault();
        if (wheelLocked) return;
        wheelLocked = true;
        go(index + (d > 0 ? 1 : -1));
        setTimeout(function () { wheelLocked = false; }, 420);
    }, { passive: false });

    // 键盘左右键
    document.addEventListener('keydown', function (e) {
        if (!morePage.classList.contains('active')) return;
        if (galleryOverlay.classList.contains('active')) return;
        if (e.key === 'ArrowLeft') go(index - 1);
        else if (e.key === 'ArrowRight') go(index + 1);
    });

    // 尺寸变化后重新居中
    let moreResizeTimer = null;
    window.addEventListener('resize', function () {
        clearTimeout(moreResizeTimer);
        moreResizeTimer = setTimeout(function () { paint(false); }, 120);
    });

    relayoutMoreCarousel = function () { paint(false); };

    paint(false);
    window.addEventListener('load', function () { paint(false); });
})();
