import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
    e.preventDefault();
    console.log('heart it!');
    axios
        // 'this' is the DOM element (form), and action is its attribute
        .post(this.action)
        .then(res => {
            console.log(res.data);
            // "this.heart" refers to the DOM element of the form where the "name" attribute equals to "heart"
            // isHearted (classList.toggle) returns the boolean value
            const isHearted = this.heart.classList.toggle('heart__button--hearted');
            $('.heart-count').textContent = res.data.hearts.length;
            if(isHearted) {
                this.heart.classList.add('heart__button--float');
                // since it's an arrow function, the context will be the form
                setTimeout(() => this.heart.classList.remove('heart__button--float'), 1500);
            }
            console.log(isHearted);
        })
        .catch(err=>console.error(err));
}

export { ajaxHeart }