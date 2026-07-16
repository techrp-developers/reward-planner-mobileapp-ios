import React from 'react';
import './FAQListingScreen.css';

interface Article {
  id: number;
  title: string;
  short_description: string;
  thumbnail: string;
}

interface ArticleCardProps {
  item: Article;
  onPress: () => void;
  grad?: [string, string];
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  item,
  onPress,
  grad = ['#8665FF', '#5B47A3'],
}) => (
  <button className="article-card" onClick={onPress}>
    <div className="thumb-container">
      <div
        className="thumb-gradient"
        style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
      />
      <img className="thumb-image" src={item.thumbnail} alt={item.title} />
    </div>

    <div className="article-content">
      <p className="article-title">{item.title}</p>
      <p className="article-snippet">{item.short_description}</p>
      <div className="article-footer">
        <button className="read-btn" onClick={onPress}>
          <span className="read-btn-text">Read Article </span>
          <span className="read-btn-arrow">›</span>
        </button>
      </div>
    </div>
  </button>
);

interface FAQListingScreenProps {
  categoryTitle: string;
  articles: Article[];
  onBack: () => void;
  onArticlePress: (article: Article) => void;
}

const FAQListingScreen: React.FC<FAQListingScreenProps> = ({
  categoryTitle,
  articles,
  onBack,
  onArticlePress,
}) => (
  <div className="faq-screen">
    {/* ── Header ── */}
    <div className="faq-header">
      <button className="faq-back-btn" onClick={onBack}>‹</button>

      <div className="faq-header-text">
        <p className="faq-header-category">Commonly Asked Questions</p>
        <p className="faq-header-title">{categoryTitle}</p>
      </div>

      {articles.length > 0 && (
        <div className="faq-header-badge">
          <span className="faq-header-badge-num">{articles.length}</span>
          <span className="faq-header-badge-label">articles</span>
        </div>
      )}
    </div>

    {/* ── Content ── */}
    <div className="faq-list-header">
      <p className="faq-list-header-title">{categoryTitle}</p>
      <p className="faq-list-header-sub">
        {articles.length > 0
          ? `${articles.length} articles · Tap any to read`
          : 'No articles available'}
      </p>
    </div>

    <div className="faq-article-list">
      {articles.map(article => (
        <ArticleCard
          key={article.id}
          item={article}
          onPress={() => onArticlePress(article)}
        />
      ))}
    </div>
  </div>
);

export default FAQListingScreen;
