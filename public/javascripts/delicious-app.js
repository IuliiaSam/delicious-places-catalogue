// this file is the entry point for javascript
// where webpack puts it all together

import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import { ajaxHeart } from './modules/heart';

// $ is a query selected, see imports
autocomplete( $('#address'), $('#lat'), $('#lng') );

typeAhead( $('.search') );

makeMap( $('#map') );

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);