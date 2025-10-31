// ===== CONFIGURATION =====
const CONFIG = {
    appName: 'Angeltia',
    version: '1.0.0',
    defaultTheme: 'dark',
    features: {
        music: true,
        camera: true,
        settings: true
    }
};

// ===== STATE MANAGEMENT =====
let state = {
    // الموسيقى
    audio: null,
    isPlaying: false,
    currentTrack: 0,
    volume: 0.5,
    tracks: [
        {
            title: 'Midnight Dreams',
            artist: 'Angeltia',
            src: 'assets/music/track1.mp3',
            cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        },
        {
            title: 'Digital Waves',
            artist: 'Angeltia',
            src: 'assets/music/track2.mp3',
            cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop'
        }
    ],
    
    // الكاميرا
    cameraStream: null,
    currentCamera: 'user',
    photos: [],
    
    // البروفايل
    profile: {
        name: ' W',
        bio: 'مطور واجهات مستخدم | مصمم تجربة مستخدم',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
        views: 1250,
        socialLinks: []
    },
    
    // الإعدادات
    settings: {
        theme: 'dark',
        autoPlay: true,
        savePhotos: true
    }
};

// ===== DOM ELEMENTS =====
const elements = {
    // الأقسام
    sections: {
        profile: document.getElementById('profile'),
        music: document.getElementById('music'),
        camera: document.getElementById('camera'),
        settings: document.getElementById('settings')
    },
    
    // البروفايل
    profile: {
        name: document.getElementById('profileName'),
        bio: document.getElementById('profileBio'),
        avatar: document.getElementById('profileAvatar'),
        views: document.getElementById('viewCount')
    },
    
    // الموسيقى
    music: {
        cover: document.getElementById('trackCover'),
        title: document.getElementById('trackTitle'),
        artist: document.getElementById('trackArtist'),
        progress: document.getElementById('progress'),
        progressBar: document.getElementById('progressBar'),
        currentTime: document.getElementById('currentTime'),
        duration: document.getElementById('duration'),
        playIcon: document.getElementById('playIcon'),
        volumeSlider: document.getElementById('volumeSlider')
    },
    
    // الكاميرا
    camera: {
        feed: document.getElementById('cameraFeed'),
        canvas: document.getElementById('photoCanvas'),
        gallery: document.getElementById('photoGallery'),
        galleryItems: document.getElementById('galleryItems')
    },
    
    // الإعدادات
    settings: {
        nameInput: document.getElementById('nameInput'),
        bioInput: document.getElementById('bioInput'),
        avatarInput: document.getElementById('avatarInput'),
        musicInput: document.getElementById('musicInput'),
        coverInput: document.getElementById('coverInput')
    },
    
    // وسائل التواصل
    social: {
        platform: document.getElementById('socialPlatform'),
        url: document.getElementById('socialUrl'),
        links: document.getElementById('socialLinks')
    },
    
    // الإشعارات
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText')
};

// ===== CORE FUNCTIONS =====

// تهيئة التطبيق
function initApp() {
    console.log(`🎵 ${CONFIG.appName} v${CONFIG.version} initialized`);
    
    // تهيئة الحالة
    loadState();
    
    // تهيئة الموسيقى
    initMusic();
    
    // تهيئة الأحداث
    initEvents();
    
    // تحديث الواجهة
    updateUI();
    
    showNotification('مرحباً بك في Angeltia! 🎉', 'success');
}

// تحميل الحالة المحفوظة
function loadState() {
    const saved = localStorage.getItem('angeltia_state');
    if (saved) {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
        // تأكد من وجود socialLinks إذا كانت غير موجودة في الحالة المحفوظة
        if (!state.profile.socialLinks) {
            state.profile.socialLinks = [];
        }
    }
    applyTheme(state.settings.theme);
}

// حفظ الحالة
function saveState() {
    localStorage.setItem('angeltia_state', JSON.stringify(state));
}

// تطبيق السمة
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.settings.theme = theme;
    saveState();
}

// تحديث الواجهة
function updateUI() {
    // تحديث البروفايل
    elements.profile.name.textContent = state.profile.name;
    elements.profile.bio.textContent = state.profile.bio;
    elements.profile.avatar.src = state.profile.avatar;
    elements.profile.views.textContent = formatNumber(state.profile.views);
    
    // تحديث الموسيقى
    updateMusicUI();
    
    // تحديث المعرض
    updateGallery();
}

// تنسيق الأرقام
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ===== NAVIGATION =====

// إظهار قسم معين
function showSection(sectionId) {
    // إخفاء جميع الأقسام
    Object.values(elements.sections).forEach(section => {
        section.classList.remove('active');
    });
    
    // إظهار القسم المطلوب
    if (elements.sections[sectionId]) {
        elements.sections[sectionId].classList.add('active');
    }
    
    // إيقاف الكاميرا إذا كانت شغالة
    if (sectionId !== 'camera' && state.cameraStream) {
        stopCamera();
    }
    
    // فتح الكاميرا تلقائياً
    if (sectionId === 'camera' && !state.cameraStream) {
        openCamera();
    }
}

// ===== MUSIC PLAYER =====

// تهيئة المشغل
function initMusic() {
    state.audio = new Audio();
    state.audio.volume = state.volume;
    
    // تحميل أول track
    loadTrack(state.currentTrack);
    
    // أحداث الصوت
    state.audio.addEventListener('loadedmetadata', updateMusicTime);
    state.audio.addEventListener('timeupdate', updateMusicProgress);
    state.audio.addEventListener('ended', nextTrack);
    
    // حدث شريط الصوت
    elements.music.volumeSlider.addEventListener('input', setVolume);
}

// تحميل track
function loadTrack(index) {
    if (state.tracks[index]) {
        const track = state.tracks[index];
        state.currentTrack = index;
        state.audio.src = track.src;
        
        // تحديث الواجهة
        elements.music.cover.src = track.cover;
        elements.music.title.textContent = track.title;
        elements.music.artist.textContent = track.artist;
        
        // إعادة التعيين
        elements.music.progress.style.width = '0%';
        elements.music.currentTime.textContent = '0:00';
        
        if (state.isPlaying) {
            state.audio.play().catch(console.error);
        }
    }
}

// تشغيل/إيقاف الموسيقى
function togglePlay() {
    if (!state.audio.src) return;
    
    if (state.isPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

// تشغيل الموسيقى
function playMusic() {
    state.audio.play().then(() => {
        state.isPlaying = true;
        elements.music.playIcon.className = 'fas fa-pause';
        increaseViews();
    }).catch(error => {
        console.error('خطأ في التشغيل:', error);
        showNotification('تعذر تشغيل الموسيقى - جاري تحميل track بديل', 'error');
        const nextIndex = (state.currentTrack + 1) % state.tracks.length;
        loadTrack(nextIndex);
        setTimeout(() => playMusic(), 1000);
    });
}

// إيقاف الموسيقى
function pauseMusic() {
    state.audio.pause();
    state.isPlaying = false;
    elements.music.playIcon.className = 'fas fa-play';
}

// التrack التالي
function nextTrack() {
    const nextIndex = (state.currentTrack + 1) % state.tracks.length;
    loadTrack(nextIndex);
    if (state.isPlaying) {
        playMusic();
    }
}

// التrack السابق
function previousTrack() {
    const prevIndex = (state.currentTrack - 1 + state.tracks.length) % state.tracks.length;
    loadTrack(prevIndex);
    if (state.isPlaying) {
        playMusic();
    }
}

// ضبط الصوت
function setVolume() {
    const volume = elements.music.volumeSlider.value / 100;
    state.volume = volume;
    state.audio.volume = volume;
}

// تحديث تقدم الموسيقى
function updateMusicProgress() {
    if (state.audio.duration) {
        const percent = (state.audio.currentTime / state.audio.duration) * 100;
        elements.music.progress.style.width = percent + '%';
        elements.music.currentTime.textContent = formatTime(state.audio.currentTime);
    }
}

// تحديث وقت الموسيقى
function updateMusicTime() {
    elements.music.duration.textContent = formatTime(state.audio.duration);
}

// تحديث واجهة الموسيقى
function updateMusicUI() {
    if (state.tracks[state.currentTrack]) {
        const track = state.tracks[state.currentTrack];
        elements.music.cover.src = track.cover;
        elements.music.title.textContent = track.title;
        elements.music.artist.textContent = track.artist;
    }
    elements.music.volumeSlider.value = state.volume * 100;
}

// تنسيق الوقت
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===== SOCIAL MEDIA FUNCTIONS =====

// إظهار نافذة وسائل التواصل
function showSocialLinks() {
    updateSocialLinksUI();
    document.getElementById('socialModal').classList.remove('hidden');
}

// إغلاق النافذة
function closeSocialModal() {
    document.getElementById('socialModal').classList.add('hidden');
}

// تحديث واجهة الروابط
function updateSocialLinksUI() {
    const socialLinksContainer = document.getElementById('socialLinks');
    socialLinksContainer.innerHTML = '';
    
    if (state.profile.socialLinks.length === 0) {
        socialLinksContainer.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 2rem;">لا توجد روابط مضافة</p>';
        return;
    }
    
    state.profile.socialLinks.forEach((link, index) => {
        const linkElement = document.createElement('div');
        linkElement.className = 'social-link-item';
        linkElement.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 1rem; margin: 0.5rem 0; background: var(--glass-bg); border-radius: 12px; border: 1px solid var(--glass-border);';
        
        linkElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                <i class="${getSocialIcon(link.platform)}" style="color: ${getSocialColor(link.platform)}; font-size: 1.5rem;"></i>
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: var(--text-primary);">${getPlatformName(link.platform)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis;">${link.url}</div>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="social-btn" onclick="openSocialLink('${link.url}')" style="background: var(--accent-primary); color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; cursor: pointer; font-size: 0.8rem;">
                    <i class="fas fa-external-link-alt"></i> فتح
                </button>
                <button class="social-btn delete-btn" onclick="deleteSocialLink(${index})" style="background: var(--danger); color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; cursor: pointer; font-size: 0.8rem;">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        `;
        
        socialLinksContainer.appendChild(linkElement);
    });
}

// إضافة رابط جديد
function addSocialLink() {
    const platform = document.getElementById('socialPlatform').value;
    const url = document.getElementById('socialUrl').value.trim();
    
    if (!url) {
        showNotification('الرجاء إدخال الرابط', 'error');
        return;
    }
    
    if (!isValidUrl(url)) {
        showNotification('الرجاء إدخال رابط صحيح يبدأ بـ https://', 'error');
        return;
    }
    
    state.profile.socialLinks.push({
        platform: platform,
        url: url,
        id: Date.now()
    });
    
    document.getElementById('socialUrl').value = '';
    updateSocialLinksUI();
    saveState();
    showNotification('تم إضافة الرابط بنجاح! ✅', 'success');
}

// حذف رابط
function deleteSocialLink(index) {
    if (confirm('هل تريد حذف هذا الرابط؟')) {
        state.profile.socialLinks.splice(index, 1);
        updateSocialLinksUI();
        saveState();
        showNotification('تم حذف الرابط 🗑️', 'success');
    }
}

// فتح الرابط
function openSocialLink(url) {
    window.open(url, '_blank');
}

// الحصول على أيقونة المنصة
function getSocialIcon(platform) {
    const icons = {
        instagram: 'fab fa-instagram',
        twitter: 'fab fa-twitter',
        youtube: 'fab fa-youtube',
        tiktok: 'fab fa-tiktok',
        snapchat: 'fab fa-snapchat-ghost',
        website: 'fas fa-globe',
        other: 'fas fa-link'
    };
    return icons[platform] || 'fas fa-link';
}

// الحصول على لون المنصة
function getSocialColor(platform) {
    const colors = {
        instagram: '#E4405F',
        twitter: '#1DA1F2',
        youtube: '#FF0000',
        tiktok: '#000000',
        snapchat: '#FFFC00',
        website: 'var(--accent-primary)',
        other: 'var(--text-secondary)'
    };
    return colors[platform] || 'var(--text-primary)';
}

// الحصول على اسم المنصة
function getPlatformName(platform) {
    const names = {
        instagram: 'انستغرام',
        twitter: 'تويتر', 
        youtube: 'يوتيوب',
        tiktok: 'تيك توك',
        snapchat: 'سناب شات',
        website: 'موقع ويب',
        other: 'رابط'
    };
    return names[platform] || 'رابط';
}

// التحقق من صحة الرابط
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch (_) {
        return false;
    }
}

// ===== CAMERA =====

// فتح الكاميرا
async function openCamera() {
    try {
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: state.currentCamera
            }
        };
        
        state.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        elements.camera.feed.srcObject = state.cameraStream;
        
        showNotification('الكاميرا جاهزة! 📸', 'success');
    } catch (error) {
        console.error('خطأ في الكاميرا:', error);
        showNotification('تعذر الوصول للكاميرا', 'error');
    }
}

// التقاط صورة
function capturePhoto() {
    if (!state.cameraStream) return;
    
    const video = elements.camera.feed;
    const canvas = elements.camera.canvas;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoData = canvas.toDataURL('image/png');
    state.photos.push({
        data: photoData,
        timestamp: new Date().toLocaleString('ar-SA'),
        id: Date.now()
    });
    
    increaseViews();
    updateGallery();
    showNotification('تم التقاط الصورة! ✅', 'success');
}

// تبديل الكاميرا
async function switchCamera() {
    if (!state.cameraStream) return;
    
    stopCamera();
    state.currentCamera = state.currentCamera === 'user' ? 'environment' : 'user';
    await openCamera();
}

// إيقاف الكاميرا
function stopCamera() {
    if (state.cameraStream) {
        state.cameraStream.getTracks().forEach(track => track.stop());
        state.cameraStream = null;
    }
}

// تبديل المعرض
function toggleGallery() {
    elements.camera.gallery.classList.toggle('hidden');
}

// تحديث المعرض
function updateGallery() {
    const galleryItems = elements.camera.galleryItems;
    galleryItems.innerHTML = '';
    
    state.photos.forEach((photo, index) => {
        const img = document.createElement('img');
        img.src = photo.data;
        img.alt = `صورة ${index + 1}`;
        img.className = 'gallery-item';
        img.onclick = () => viewPhoto(photo);
        galleryItems.appendChild(img);
    });
}

// عرض صورة
function viewPhoto(photo) {
    const link = document.createElement('a');
    link.href = photo.data;
    link.download = `angeltia_photo_${photo.id}.png`;
    link.click();
    showNotification('جاري تحميل الصورة...', 'info');
}

// ===== SETTINGS =====

// تغيير السمة
function changeTheme(theme) {
    applyTheme(theme);
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    
    showNotification(`تم التغيير إلى الوضع ${theme === 'dark' ? 'الداكن' : 'الفاتح'}`, 'success');
}

// حفظ الإعدادات
function saveProfile() {
    const name = elements.settings.nameInput.value.trim();
    const bio = elements.settings.bioInput.value.trim();
    
    if (name) state.profile.name = name;
    if (bio) state.profile.bio = bio;
    
    const avatarFile = elements.settings.avatarInput.files[0];
    if (avatarFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            state.profile.avatar = e.target.result;
            updateUI();
        };
        reader.readAsDataURL(avatarFile);
    }
    
    const coverFile = elements.settings.coverInput.files[0];
    if (coverFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            state.tracks[state.currentTrack].cover = e.target.result;
            updateMusicUI();
        };
        reader.readAsDataURL(coverFile);
    }
    
    updateUI();
    saveState();
    showNotification('تم حفظ الإعدادات بنجاح! ✅', 'success');
}

// ===== PLAYLIST FUNCTIONS =====

// إظهار القائمة الموسيقية
function showPlaylist() {
    let playlistHTML = '<div class="playlist-modal glass-card" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000; padding: 2rem; max-width: 500px; width: 90%;">';
    playlistHTML += '<div class="playlist-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">';
    playlistHTML += '<h3>قائمة التشغيل</h3>';
    playlistHTML += '<button class="close-btn" onclick="closePlaylist()"><i class="fas fa-times"></i></button>';
    playlistHTML += '</div>';
    playlistHTML += '<div class="playlist-items">';
    
    state.tracks.forEach((track, index) => {
        const isActive = index === state.currentTrack;
        playlistHTML += `<div class="playlist-item ${isActive ? 'active' : ''}" style="padding: 1rem; margin: 0.5rem 0; background: ${isActive ? 'var(--accent-glow)' : 'transparent'}; border-radius: 12px; cursor: pointer; transition: var(--transition-fast); display: flex; justify-content: space-between; align-items: center;">`;
        playlistHTML += `<div onclick="playFromPlaylist(${index})" style="flex: 1;">`;
        playlistHTML += `<strong>${track.title}</strong>`;
        playlistHTML += `<br><span style="color: var(--text-secondary); font-size: 0.9rem;">${track.artist}</span>`;
        playlistHTML += `</div>`;
        if (track.src.startsWith('data:')) {
            playlistHTML += `<button class="delete-btn" onclick="deleteTrack(${index})" style="background: var(--danger); color: white; border: none; border-radius: 8px; padding: 0.5rem; cursor: pointer; margin-right: 1rem;">`;
            playlistHTML += `<i class="fas fa-trash"></i>`;
            playlistHTML += `</button>`;
        }
        playlistHTML += '</div>';
    });
    
    playlistHTML += '</div></div>';
    
    const modal = document.createElement('div');
    modal.id = 'playlistModal';
    modal.innerHTML = playlistHTML;
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.zIndex = '9999';
    
    document.body.appendChild(modal);
}

// إغلاق القائمة
function closePlaylist() {
    const modal = document.getElementById('playlistModal');
    if (modal) modal.remove();
}

// تشغيل من القائمة
function playFromPlaylist(index) {
    loadTrack(index);
    if (!state.isPlaying) playMusic();
    closePlaylist();
}

// حذف الأغنية
function deleteTrack(index) {
    if (confirm(`هل تريدين حذف "${state.tracks[index].title}"؟`)) {
        state.tracks.splice(index, 1);
        
        if (state.currentTrack >= state.tracks.length) {
            state.currentTrack = 0;
        }
        
        if (state.tracks.length === 0) {
            pauseMusic();
            state.audio.src = '';
            updateMusicUI();
        } else {
            loadTrack(state.currentTrack);
        }
        
        closePlaylist();
        saveState();
        showNotification('تم حذف الأغنية 🗑️', 'success');
    }
}

// ===== UTILITY FUNCTIONS =====

// زيادة المشاهدات
function increaseViews() {
    state.profile.views++;
    updateUI();
    saveState();
}

// معالجة رفع ملفات الموسيقى
function handleMusicUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const newTrack = {
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: 'مستخدم',
                src: e.target.result,
                cover: state.tracks[0].cover
            };
            state.tracks.push(newTrack);
            showNotification('تم إضافة الأغنية بنجاح! 🎵', 'success');
            saveState();
        };
        reader.readAsDataURL(file);
    } else {
        showNotification('الرجاء اختيار ملف صوتي صحيح', 'error');
    }
}

// ===== NOTIFICATIONS =====

// إظهار الإشعار
function showNotification(message, type = 'info') {
    elements.notificationText.textContent = message;
    elements.notification.className = `notification ${type}`;
    elements.notification.classList.remove('hidden');
    
    setTimeout(() => {
        elements.notification.classList.add('hidden');
    }, 3000);
}

// ===== EVENT HANDLERS =====

function initEvents() {
    // أحداث الموسيقى
    elements.music.progressBar.addEventListener('click', (e) => {
        if (!state.audio.duration) return;
        const rect = elements.music.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        state.audio.currentTime = percent * state.audio.duration;
    });
    
    elements.music.volumeSlider.addEventListener('change', setVolume);
    elements.settings.musicInput.addEventListener('change', handleMusicUpload);
    
    // زيادة المشاهدات
    document.addEventListener('click', () => {
        if (Math.random() > 0.8) increaseViews();
    });
    
    // أحداث الكاميرا
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && state.cameraStream) capturePhoto();
    });
    
    // تحديث العداد
    setInterval(() => {
        const randomIncrease = Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0;
        state.profile.views += randomIncrease;
        if (state.profile.views % 10 === 0) saveState();
        updateUI();
    }, 30000);
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', initApp);

window.addEventListener('beforeunload', () => {
    if (state.cameraStream) stopCamera();
    if (state.isPlaying) pauseMusic();
    saveState();
});

console.log('🚀 Angeltia Portfolio Loaded Successfully!');