export const nailShopPublicTheme = {
  deepPlum: '#2B102E',
  blackCherry: '#3D0718',
  cream: '#FFF4E6',
  rose: '#D98092',
  softGold: '#D9B76F',
};

export const nailShopPublicStyles = `
  .nail-shop-public-shell {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(217, 183, 111, 0.28), transparent 30rem),
      radial-gradient(circle at 80% 10%, rgba(217, 128, 146, 0.24), transparent 24rem),
      linear-gradient(135deg, #2B102E 0%, #3D0718 48%, #140816 100%);
    color: #FFF4E6;
    font-family: Georgia, 'Times New Roman', serif;
    padding: clamp(1rem, 3vw, 2.5rem);
  }

  .nail-shop-public-shell * { box-sizing: border-box; }

  .nail-shop-public-shell__frame {
    max-width: 1180px;
    margin: 0 auto;
  }

  .nail-shop-public-shell__hero,
  .nail-shop-public-shell__display,
  .nail-shop-public-shell__tabs,
  .nail-shop-public-shell__panel {
    border: 1px solid rgba(217, 183, 111, 0.34);
    background: linear-gradient(145deg, rgba(255, 244, 230, 0.14), rgba(255, 244, 230, 0.06));
    box-shadow: 0 28px 80px rgba(20, 8, 22, 0.42), inset 0 1px 0 rgba(255, 244, 230, 0.18);
    backdrop-filter: blur(18px);
  }

  .nail-shop-public-shell__hero {
    border-radius: 32px;
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(280px, 0.88fr);
    gap: clamp(1.5rem, 4vw, 3rem);
    padding: clamp(1.5rem, 5vw, 4rem);
    overflow: hidden;
    position: relative;
  }

  .nail-shop-public-shell__eyebrow {
    color: #D9B76F;
    font-family: Arial, sans-serif;
    font-size: 0.76rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    margin: 0 0 1rem;
  }

  .nail-shop-public-shell__title {
    font-size: clamp(3rem, 9vw, 6.75rem);
    line-height: 0.9;
    margin: 0;
    letter-spacing: -0.07em;
  }

  .nail-shop-public-shell__tagline {
    color: rgba(255, 244, 230, 0.82);
    font-size: clamp(1.05rem, 2vw, 1.35rem);
    line-height: 1.7;
    max-width: 38rem;
    margin: 1.35rem 0 0;
  }

  .nail-shop-public-shell__actions { display: flex; flex-wrap: wrap; gap: 0.85rem; margin-top: 2rem; }

  .nail-shop-public-shell__button {
    border: 1px solid rgba(217, 183, 111, 0.52);
    border-radius: 999px;
    cursor: default;
    font-family: Arial, sans-serif;
    font-weight: 800;
    letter-spacing: 0.04em;
    min-height: 3rem;
    padding: 0.85rem 1.3rem;
  }

  .nail-shop-public-shell__button--primary { background: #D9B76F; color: #2B102E; box-shadow: 0 16px 35px rgba(217, 183, 111, 0.28); }
  .nail-shop-public-shell__button--secondary { background: rgba(255, 244, 230, 0.08); color: #FFF4E6; }

  .nail-shop-public-shell__signature {
    align-self: stretch;
    border-radius: 28px;
    background: linear-gradient(160deg, rgba(255, 244, 230, 0.94), rgba(217, 128, 146, 0.32));
    color: #2B102E;
    min-height: 23rem;
    padding: 1.4rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 28px 60px rgba(0, 0, 0, 0.28);
  }

  .nail-shop-public-shell__nail {
    width: min(58%, 13rem);
    aspect-ratio: 0.52;
    margin: 1rem auto;
    border-radius: 48% 48% 44% 44% / 34% 34% 58% 58%;
    background: linear-gradient(145deg, #FFF4E6 0%, #D98092 45%, #3D0718 100%);
    box-shadow: inset 18px 6px 30px rgba(255,255,255,0.38), inset -18px -20px 35px rgba(43,16,46,0.35), 0 30px 55px rgba(61,7,24,0.3);
  }

  .nail-shop-public-shell__placeholder { font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.72rem; color: rgba(43, 16, 46, 0.72); }
  .nail-shop-public-shell__location { color: #D9B76F; font-family: Arial, sans-serif; font-weight: 800; margin-top: 1rem; }

  .nail-shop-public-shell__display { border-radius: 28px; margin-top: 1.3rem; padding: clamp(1rem, 3vw, 2rem); }
  .nail-shop-public-shell__section-title { font-size: clamp(1.8rem, 4vw, 3rem); margin: 0 0 1.25rem; letter-spacing: -0.04em; }
  .nail-shop-public-shell__cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
  .nail-shop-public-shell__card { min-height: 12rem; border-radius: 24px; padding: 1rem; background: linear-gradient(150deg, rgba(255,244,230,0.18), rgba(217,128,146,0.12)); border: 1px solid rgba(255,244,230,0.16); box-shadow: 0 18px 40px rgba(20,8,22,0.24); }
  .nail-shop-public-shell__card-orb { height: 7rem; border-radius: 20px; background: radial-gradient(circle at 30% 20%, #FFF4E6, #D98092 42%, #3D0718 100%); margin-bottom: 1rem; }

  .nail-shop-public-shell__tabs { border-radius: 999px; display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.3rem; padding: 0.6rem; }
  .nail-shop-public-shell__tab { border: 0; border-radius: 999px; background: transparent; color: rgba(255,244,230,0.76); font-family: Arial, sans-serif; font-weight: 800; padding: 0.8rem 1rem; }
  .nail-shop-public-shell__tab:first-child { background: rgba(217,183,111,0.22); color: #FFF4E6; }
  .nail-shop-public-shell__panel { border-radius: 28px; margin-top: 1rem; min-height: 13rem; padding: clamp(1.2rem, 3vw, 2rem); }
  .nail-shop-public-shell__panel-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1rem; }
  .nail-shop-public-shell__line { height: 0.9rem; border-radius: 999px; background: rgba(255,244,230,0.16); margin: 0.8rem 0; }
  .nail-shop-public-shell__line--short { width: 62%; }

  @media (max-width: 860px) {
    .nail-shop-public-shell__hero, .nail-shop-public-shell__panel-grid { grid-template-columns: 1fr; }
    .nail-shop-public-shell__cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 560px) {
    .nail-shop-public-shell { padding: 0.8rem; }
    .nail-shop-public-shell__hero { border-radius: 24px; }
    .nail-shop-public-shell__cards { grid-template-columns: 1fr; }
    .nail-shop-public-shell__tabs { border-radius: 24px; }
    .nail-shop-public-shell__tab { flex: 1 1 45%; }
  }
`;
