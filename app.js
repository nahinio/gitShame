/**
 * GitShame - Core Logic
 */

// --- CONFIGURATION ---
const CONFIG = {
    theme: {
        accent: '#FF3B30',
        secondary: '#FFB300'
    },
    apiBase: 'https://api.github.com'
};

// --- CLASSES ---

class GitHubFetcher {
    constructor(username) {
        this.username = username;
        this.userData = null;
        this.events = [];
        this.repos = [];
    }

    async fetchAll() {
        try {
            this.userData = await this._fetch(`/users/${this.username}`);
            const page1 = await this._fetch(`/users/${this.username}/events?per_page=100&page=1`);
            const page2 = await this._fetch(`/users/${this.username}/events?per_page=100&page=2`);
            this.events = [...page1, ...page2];
            this.repos = await this._fetch(`/users/${this.username}/repos?sort=updated&per_page=10`);
            return { success: true };
        } catch (error) {
            console.error("GitHub Fetch Error:", error);
            if (error.status === 404) return { success: false, error: 'User not found' };
            if (error.status === 403) return { success: false, error: 'Rate limit exceeded. Try again later.' };
            return { success: false, error: 'Network error' };
        }
    }

    async _fetch(endpoint) {
        const url = `${CONFIG.apiBase}${endpoint}`;
        const response = await fetch(url);
        if (!response.ok) {
            const err = new Error(response.statusText);
            err.status = response.status;
            throw err;
        }
        return await response.json();
    }
}

class StatsEngine {
    constructor(data) {
        this.data = data;
    }

    process() {
        const stats = {
            commits: 0,
            issuesOpened: 0,
            issuesClosed: 0,
            prOpened: 0,
            prMerged: 0,
            prClosed: 0,
            worstCommitMsg: "Fixed stuff",
            commitHours: {},
            languages: {},
            streak: 0
        };

        if (!this.data.events || this.data.events.length === 0) return stats;

        const toDate = (str) => new Date(str).toDateString();
        const activeDays = new Set();
        const commitMessages = [];

        this.data.events.forEach(event => {
            const date = new Date(event.created_at);
            const hour = date.getHours();
            stats.commitHours[hour] = (stats.commitHours[hour] || 0) + 1;
            activeDays.add(toDate(event.created_at));

            switch (event.type) {
                case 'PushEvent':
                    stats.commits += event.payload.size;
                    if (event.payload.commits) {
                        event.payload.commits.forEach(c => commitMessages.push(c.message));
                    }
                    break;
                case 'IssuesEvent':
                    if (event.payload.action === 'opened') stats.issuesOpened++;
                    if (event.payload.action === 'closed') stats.issuesClosed++;
                    break;
                case 'PullRequestEvent':
                    if (event.payload.action === 'opened') stats.prOpened++;
                    if (event.payload.action === 'closed') {
                        if (event.payload.pull_request && event.payload.pull_request.merged) stats.prMerged++;
                        else stats.prClosed++;
                    }
                    break;
            }
        });

        if (this.data.repos) {
            this.data.repos.forEach(repo => {
                if (repo.language) {
                    stats.languages[repo.language] = (stats.languages[repo.language] || 0) + 1;
                }
            });
        }

        stats.streak = activeDays.size > 0 ? activeDays.size : 0;

        const badKeywords = ['fix', 'oops', 'damn', 'wip', 'test', 'temp', '.'];
        const funnyCommits = commitMessages.filter(msg => {
            const lower = msg.toLowerCase();
            return msg.length < 10 || badKeywords.some(w => lower.includes(w));
        });
        if (funnyCommits.length > 0) {
            stats.worstCommitMsg = funnyCommits[Math.floor(Math.random() * funnyCommits.length)];
        } else if (commitMessages.length > 0) {
            stats.worstCommitMsg = commitMessages[0];
        }

        return stats;
    }
}

class RoastGenerator {
    constructor(stats) {
        this.stats = stats;
    }

    generate() {
        const s = this.stats;
        const slides = [];

        // Slide 1: Commit Crimes
        let commitTexts = [];
        if (s.commits < 20) {
            commitTexts = [
                `You committed ${s.commits} times. My grandma commits more code to her knitting patterns.`,
                `Only ${s.commits} commits? Did you forget your password for 11 months?`,
                `A quiet year. Too stealthy. Either you're a genius or you're unemployed.`
            ];
        } else if (s.commits > 1000) {
            commitTexts = [
                `${s.commits} commits. Go touch grass. Please.`,
                `You pushed code ${s.commits} times. Your keyboard must hate you.`,
                `Productivity score: 100. Social life score: Error 404.`
            ];
        } else {
            commitTexts = [
                `${s.commits} commits. Solid. Boring, but solid.`,
                `You did the work. Nothing flashy. Just... work.`,
                `Consistency is key. You exist.`
            ];
        }
        slides.push({ title: "Commit Crimes", text_variations: commitTexts, stat: `${s.commits} Commits` });

        // Slide 2: Bug Bodycount
        const totalIssues = s.issuesOpened + s.issuesClosed;
        let bugTexts = [];
        if (totalIssues === 0) {
            bugTexts = [
                `Zero issues. Likely because you write zero code anyone uses.`,
                `No bugs reported? Or just no one cares enough to report them?`,
                `Clean sheet. Suspiciously clean.`
            ];
        } else {
            bugTexts = [
                `Opened ${s.issuesOpened} cans of worms. Closed ${s.issuesClosed}.`,
                `You love complaining. ${s.issuesOpened} issues opened.`,
                `Bug hunter or bug breeder? You decide.`
            ];
        }
        slides.push({ title: "Bug Bodycount", text_variations: bugTexts, stat: `${totalIssues} Issues` });

        // Slide 3: PR Survival
        let prTexts = [];
        if (s.prMerged === 0 && s.prOpened > 0) {
            prTexts = [
                `Output: ${s.prOpened} PRs. Merged: 0. Ouch.`,
                `Rejected. Again. And again.`,
                `Your code is... controversial.`
            ];
        } else if (s.prMerged > 50) {
            prTexts = [
                `Merged ${s.prMerged} PRs. Send your team a thank you card.`,
                `Ship it. Ship it good.`,
                `You merge more than a highway onramp.`
            ];
        } else {
            prTexts = [
                `Survival rate: Moderate. You're getting there.`,
                `Merged ${s.prMerged} PRs. Not bad, kid.`,
                `Slow and steady wins the merge race.`
            ];
        }
        slides.push({ title: "PR Survival", text_variations: prTexts, stat: `${s.prMerged} Merged / ${s.prOpened} Opened` });

        // Slide 4: Worst Commit
        const worstMsg = s.worstCommitMsg || "update";
        slides.push({
            title: "Commit Syntax",
            text_variations: [
                `"${worstMsg}" - Poet Laureate of the repository.`,
                `Commit message: "${worstMsg}". Very descriptive.`,
                `When you wrote "${worstMsg}", what were you feeling?`
            ],
            stat: `Actual Commit Msg`
        });

        // Final Verdict
        let verdict = {};
        if (s.commits < 50) {
            verdict = {
                summary_variations: [
                    `The "Ghost". You were barely there.`,
                    `Verdict: Lurker.`,
                    `I've seen more activity in a cemetery.`
                ]
            };
        } else {
            verdict = {
                summary_variations: [
                    `You coded. You merged. You survived.`,
                    `Verdict: Certified Developer.`,
                    `Outcome: 10x Engineer (on a log scale).`
                ]
            };
        }

        return { slides, final_verdict: verdict };
    }
}

class UIController {
    constructor() {
        this.elements = {
            input: document.getElementById('usernameInput'),
            btn: document.getElementById('roastBtn'),
            hero: document.getElementById('heroSection'),
            loading: document.getElementById('loadingState'),
            loadingText: document.querySelector('.loading-text'),
            slidesContainer: document.getElementById('slidesContainer'),
            slideWrapper: document.getElementById('slideWrapper'),
            warning: document.getElementById('warningBanner'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            indicators: document.getElementById('slideIndicators'),
                pngContainer: document.getElementById('pngExportContainer'),
                notFound: document.getElementById('notFound'),
                tryAgainBtn: document.getElementById('tryAgainBtn')
        };

        this.state = {
            currentSlide: 0,
            totalSlides: 0,
            roastData: null,
            userData: null
        };

        this.loadingMessages = [
            "Fetching your commits...",
            "Counting your sins...",
            "Composing roast...",
            "Preparing the shame..."
        ];

        this.init();
    }

    init() {
        this.elements.btn.addEventListener('click', () => this.handleRoast());
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRoast();
        });
        if (this.elements.tryAgainBtn) {
            this.elements.tryAgainBtn.addEventListener('click', () => this.hideUserNotFound());
        }
        // Close not-found on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.notFound && !this.elements.notFound.classList.contains('hidden')) {
                this.hideUserNotFound();
            }
        });
        this.elements.prevBtn.addEventListener('click', () => this.changeSlide(-1));
        this.elements.nextBtn.addEventListener('click', () => this.changeSlide(1));
    }

    async handleRoast() {
        const username = this.elements.input.value.trim();
        if (!username) return;

        this.setLoading(true);
        this.startLoadingMessages();

        try {
            const fetcher = new GitHubFetcher(username);
            const fetchResult = await fetcher.fetchAll();

            if (!fetchResult.success) {
                throw new Error(fetchResult.error || 'Fetch failed');
            }

            const statsEngine = new StatsEngine({ events: fetcher.events, repos: fetcher.repos });
            const stats = statsEngine.process();

            const generator = new RoastGenerator(stats);
            this.state.roastData = generator.generate();
            this.state.userData = fetcher.userData;

            this.renderSlides();
            this.setLoading(false);
            this.showSlides();

        } catch (error) {
            console.error(error);
                const msg = (error && error.message) ? error.message : "Error: User not found or API limits hit.";
                if (msg === 'User not found') {
                    this.setLoading(false);
                    this.showUserNotFound();
                } else {
                    this.elements.warning.querySelector('.warning-text').textContent = msg;
                    this.setLoading(false);
                    this.elements.hero.classList.remove('hidden');
                }
        }
    }

    startLoadingMessages() {
        let i = 0;
        this.loadingInterval = setInterval(() => {
            if (this.elements.loadingText) {
                this.elements.loadingText.textContent = this.loadingMessages[i % this.loadingMessages.length];
            }
            i++;
        }, 1500);
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.elements.hero.classList.add('hidden');
            this.elements.loading.classList.remove('hidden');
            this.elements.slidesContainer.classList.add('hidden');
            if (this.elements.notFound) this.elements.notFound.classList.add('hidden');
        } else {
            this.elements.loading.classList.add('hidden');
            if (this.loadingInterval) clearInterval(this.loadingInterval);
        }
    }

    showSlides() {
        this.elements.hero.classList.add('hidden');
        this.elements.slidesContainer.classList.remove('hidden');
        if (this.elements.notFound) this.elements.notFound.classList.add('hidden');
    }

    showUserNotFound() {
        if (this.elements.notFound) {
            this.elements.notFound.classList.remove('hidden');
            // add a 'show' class for CSS animation triggers
            this.elements.notFound.classList.add('show');
        }
        if (this.elements.slidesContainer) this.elements.slidesContainer.classList.add('hidden');
        if (this.elements.loading) this.elements.loading.classList.add('hidden');
        // focus the try again button for immediate keyboard access
        if (this.elements.tryAgainBtn) this.elements.tryAgainBtn.focus();
    }

    hideUserNotFound() {
        if (this.elements.notFound) {
            this.elements.notFound.classList.add('hidden');
            this.elements.notFound.classList.remove('show');
        }
        // Keep hero content intact — we're overlaying the not-found modal for context
        if (this.elements.input) {
            this.elements.input.value = '';
            this.elements.input.focus();
        }
    }

    renderSlides() {
        const { slides, final_verdict } = this.state.roastData;
        this.elements.slideWrapper.innerHTML = '';
        this.elements.indicators.innerHTML = '';

        slides.forEach((slide, index) => {
            const text = slide.text_variations[Math.floor(Math.random() * slide.text_variations.length)];
            const slideEl = document.createElement('div');
            slideEl.className = 'slide';
            slideEl.innerHTML = `
                <div class="slide-content">
                    <h2 class="slide-title">${slide.title}</h2>
                    <div class="stat-chip">${slide.stat}</div>
                    <p class="roast-text">"${text}"</p>
                </div>
            `;
            this.elements.slideWrapper.appendChild(slideEl);
            this.addIndicator(index);
        });

        const verdictText = final_verdict.summary_variations[Math.floor(Math.random() * final_verdict.summary_variations.length)];
        const finalSlide = document.createElement('div');
        finalSlide.className = 'slide final-slide';
        finalSlide.innerHTML = `
            <div class="slide-content">
                <h2 class="slide-title">Final Verdict</h2>
                <div class="user-info">
                    <img src="${this.state.userData.avatar_url}" class="avatar" alt="Avatar">
                    <span class="handle">@${this.state.userData.login}</span>
                </div>
                <p class="roast-text large">"${verdictText}"</p>
                <button id="downloadBtn" class="primary-btn download-btn">Download Story (PNG)</button>
                <div id="downloadStatus" class="microcopy"></div>
            </div>
        `;
        this.elements.slideWrapper.appendChild(finalSlide);
        this.addIndicator(slides.length);

        setTimeout(() => {
            const downloadBtn = document.getElementById('downloadBtn');
            if (downloadBtn) downloadBtn.addEventListener('click', () => this.generatePNG());
        }, 0);

        this.state.totalSlides = slides.length + 1;
        this.state.currentSlide = 0;
        this.updateSlideView();
    }

    addIndicator(index) {
        const dot = document.createElement('div');
        dot.className = 'indicator-dot';
        if (index === 0) dot.classList.add('active');
        this.elements.indicators.appendChild(dot);
    }

    changeSlide(dir) {
        const newIndex = this.state.currentSlide + dir;
        if (newIndex >= 0 && newIndex < this.state.totalSlides) {
            this.state.currentSlide = newIndex;
            this.updateSlideView();
        }
    }

    updateSlideView() {
        const offset = -this.state.currentSlide * 100;
        this.elements.slideWrapper.style.transform = `translateX(${offset}%)`;
        const dots = this.elements.indicators.children;
        Array.from(dots).forEach((dot, i) => {
            dot.classList.toggle('active', i === this.state.currentSlide);
        });
    }

    async generatePNG() {
        const btn = document.getElementById('downloadBtn');
        const status = document.getElementById('downloadStatus');
        if (btn) { btn.disabled = true; btn.textContent = "Generating..."; }

        try {
            const container = this.elements.pngContainer;
            container.innerHTML = '';
            const { slides, final_verdict } = this.state.roastData;
            const verdictText = final_verdict.summary_variations[Math.floor(Math.random() * final_verdict.summary_variations.length)];

            container.innerHTML = `
                <div class="story-export-layout">
                    <div class="story-main">
                        <img src="${this.state.userData.avatar_url}" class="story-avatar" crossorigin="anonymous">
                        <h2 class="story-username">@${this.state.userData.login}</h2>
                        <div class="story-roast-box"><p class="story-roast">"${verdictText}"</p></div>
                        <div class="story-stats">
                            <div class="story-stat-item"><span class="label">Commits</span><span class="value">${slides[0].stat.split(' ')[0]}</span></div>
                            <div class="story-stat-item"><span class="label">Issues</span><span class="value">${slides[1].stat.split(' ')[0]}</span></div>
                        </div>
                    </div>
                    <div class="story-footer"></div>
                </div>
            `;

            const img = container.querySelector('img');
            if (img) {
                await new Promise((resolve, reject) => {
                    if (img.complete) resolve();
                    else { img.onload = resolve; img.onerror = reject; }
                });
            }

            // Ensure webfonts have been loaded so text rasterizes correctly
            if (document.fonts && document.fonts.ready) await document.fonts.ready;
            // Increase scale slightly to improve antialiasing/crispness on text in the generated PNG
            const canvas = await html2canvas(container, { width: 1080, height: 1920, scale: 1.5, backgroundColor: '#000000', useCORS: true });
            const link = document.createElement('a');
            link.download = `gitshame-${this.state.userData.login}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            if (btn) { btn.textContent = "Downloaded!"; setTimeout(() => { btn.disabled = false; btn.textContent = "Download Story (PNG)"; }, 3000); }
        } catch (e) {
            console.error(e);
            if (status) status.textContent = "Error generating PNG.";
            if (btn) btn.disabled = false;
        }
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});
