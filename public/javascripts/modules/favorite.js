import axios from 'axios';
import { $ } from './bling';

function ajaxFavorite(e) {
  e.preventDefault();
  console.log('Added to Favorites');
  axios
    .post(this.action)
    .then(res => {
      const isFavorited = this.favorite.classList.toggle('heart__button--hearted');
      $('.heart-count').textContent = res.data.favorites.length;
      if (isFavorited) {
        this.favorite.classList.add('heart__button--float');
        setTimeout(() => this.favorite.classList.remove('heart__button--float'), 2500);
      }
      console.log(isFavorited);
    })
    .catch(console.error);
}

export default ajaxFavorite;