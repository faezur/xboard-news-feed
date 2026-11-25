async function fetchNews(feedUrl) {

    const apiUrl =
        "https://api.rss2json.com/v1/api.json?rss_url=" +
        encodeURIComponent(feedUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error("Failed to fetch news");
    }

    const data = await response.json();

    if (data.status !== "ok") {
        throw new Error(data.message || "RSS API error");
    }

    return Array.isArray(data.items) ? data.items : [];
}


/* =====================================
   GET ARTICLE IMAGE
===================================== */

function getArticleImage(article) {

    return (
        article.thumbnail ||
        article.enclosure?.link ||
        article.enclosure?.thumbnail ||
        ""
    );
}


/* =====================================
   CLEAN ARTICLE DESCRIPTION
===================================== */

function cleanDescription(description) {

    const tempElement = document.createElement("div");

    tempElement.innerHTML = description || "";

    return (
        tempElement.textContent ||
        tempElement.innerText ||
        ""
    )
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


/* =====================================
   DISPLAY NEWS CAROUSEL
===================================== */

function displayNewsCarousel(articles, containerId, carouselId) {

    const container = document.getElementById(containerId);

    if (!container) {
        console.error("Container not found:", containerId);
        return;
    }

    container.innerHTML = "";

    if (!articles || articles.length === 0) {

        container.textContent = "No news articles available.";
        return;
    }

    // Carousel structure

    const carousel = document.createElement("div");

    carousel.id = carouselId;
    carousel.className = "carousel slide news-carousel";

    carousel.setAttribute("data-bs-interval", "false");
    carousel.setAttribute("data-bs-wrap", "false");

    const carouselInner = document.createElement("div");

    carouselInner.className = "carousel-inner";


    // Create slides

    articles.forEach((article, index) => {

        const carouselItem = document.createElement("div");

        carouselItem.className =
            "carousel-item" +
            (index === 0 ? " active" : "");


        // News Card

        const card = document.createElement("article");

        card.className = "news-card";


        // Article Image

        const imageWrapper = document.createElement("div");

        imageWrapper.className = "news-image-wrapper";

        const imageUrl = getArticleImage(article);

        if (imageUrl) {

            const image = document.createElement("img");

            image.src = imageUrl;
            image.alt = article.title || "News image";
            image.className = "news-image";

            image.loading = index === 0 ? "eager" : "lazy";

            image.onerror = function () {
                this.style.display = "none";
            };

            imageWrapper.appendChild(image);
        }


        // Card Body

        const body = document.createElement("div");

        body.className = "news-card-body";


        // Heading Row

        const headingRow = document.createElement("div");

        headingRow.className = "article-heading-row";


        // Article Title

        const title = document.createElement("h3");

        title.className = "news-title";

        title.textContent = article.title || "Untitled";


        // Carousel Navigation

        const navigation = document.createElement("div");

        navigation.className = "article-navigation";


        // Previous Button

        if (articles.length > 1 && index > 0) {

            const previousButton = document.createElement("button");

            previousButton.type = "button";
            previousButton.className = "article-nav-btn";

            previousButton.innerHTML = "&#8249;";

            previousButton.setAttribute(
                "aria-label",
                "Previous article"
            );

            previousButton.setAttribute(
                "data-bs-target",
                "#" + carouselId
            );

            previousButton.setAttribute(
                "data-bs-slide",
                "prev"
            );

            navigation.appendChild(previousButton);
        }


        // Next Button

        if (articles.length > 1 && index < articles.length - 1) {

            const nextButton = document.createElement("button");

            nextButton.type = "button";
            nextButton.className = "article-nav-btn";

            nextButton.innerHTML = "&#8250;";

            nextButton.setAttribute(
                "aria-label",
                "Next article"
            );

            nextButton.setAttribute(
                "data-bs-target",
                "#" + carouselId
            );

            nextButton.setAttribute(
                "data-bs-slide",
                "next"
            );

            navigation.appendChild(nextButton);
        }

        headingRow.append(title, navigation);


        // Author and Date

        const meta = document.createElement("div");

        meta.className = "news-meta";


        const author = document.createElement("span");

        author.textContent = article.author || "News Desk";


        const separator = document.createElement("span");

        separator.className = "meta-dot";

        separator.textContent = "•";


        const date = document.createElement("span");

        if (article.pubDate) {

            const publishedDate = new Date(article.pubDate);

            if (!Number.isNaN(publishedDate.getTime())) {

                date.textContent =
                    publishedDate.toLocaleDateString("en-US");
            }
        }

        meta.append(author, separator, date);


        // Description

        const description = document.createElement("p");

        description.className = "news-description";

        description.textContent =
            cleanDescription(article.description);


        // Article Link

        const articleLink = document.createElement("a");

        articleLink.className = "news-card-link";

        articleLink.href = article.link || "#";

        articleLink.target = "_blank";

        articleLink.rel = "noopener noreferrer";

        articleLink.setAttribute(
            "aria-label",
            "Read full article"
        );


        // Append Elements

        body.append(
            headingRow,
            meta,
            description
        );

        card.append(
            imageWrapper,
            body,
            articleLink
        );

        carouselItem.appendChild(card);

        carouselInner.appendChild(carouselItem);

    });


    // Final Carousel

    carousel.appendChild(carouselInner);

    container.appendChild(carousel);
}


/* =====================================
   LOAD ALL NEWS FEEDS
===================================== */

async function loadAllNews() {

    if (
        typeof magazines === "undefined" ||
        !Array.isArray(magazines)
    ) {

        console.error(
            "The magazines array is not available. Check magazines.js."
        );

        return;
    }


    // Feed mapping

    const topics = [

        {
            id: "politics-content",
            carouselId: "politics-carousel"
        },

        {
            id: "technology-content",
            carouselId: "technology-carousel"
        },

        {
            id: "sports-content",
            carouselId: "sports-carousel"
        }

    ];


    const feedCount = Math.min(
        magazines.length,
        topics.length
    );


    // Fetch each RSS feed

    for (let i = 0; i < feedCount; i++) {

        try {

            const articles = await fetchNews(magazines[i]);

            displayNewsCarousel(
                articles,
                topics[i].id,
                topics[i].carouselId
            );

        } catch (error) {

            console.error(
                "News loading error:",
                error
            );

            const container = document.getElementById(
                topics[i].id
            );

            if (container) {

                container.textContent =
                    "Unable to load news. Please try again.";
            }
        }
    }


    if (magazines.length !== topics.length) {

        console.warn(
            "Feed count and page section count differ:",
            magazines.length,
            topics.length
        );
    }
}


/* =====================================
   INITIALIZE NEWS FEED
===================================== */

document.addEventListener(
    "DOMContentLoaded",
    loadAllNews
);



