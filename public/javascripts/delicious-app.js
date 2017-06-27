import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/type-ahead';
import makeMap from './modules/map';
import ajaxFavorite from './modules/favorite';

autocomplete($('#address'), $('#lat'), $('#lng'));

typeAhead($('.search'));

makeMap($('#map'));

const favoriteForms = $$('form.heart');
favoriteForms.on('submit', ajaxFavorite);

