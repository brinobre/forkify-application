import Search from './models/Search'
import Recipe from './models/Recipe'
import List from './models/List'
import Likes from './models/Likes'

import * as searchView from './views/SearchView'
import * as recipeView from './views/recipeView'
import * as listView from './views/listView'
import * as likeView from './views/likesView'
import { elements, renderLoader, clearLoader } from './views/base' 

/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */

const state = {};

/** 
 * SEARCH CONTROLLER 
 */
const controlSearch = async () => {
    // 1) Get the query from the view
        const query = searchView.getInput(); // TODO

        if(query) {
            // 2) New search object and add to state
            state.search = new Search(query);

            // 3) Prepare UI for results
            searchView.clearInput();
            searchView.clearResults();
            renderLoader(elements.searchRes);

            try {
                // 4) Search for recipes
            await state.search.getResults();

            // 5) Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
            } catch(error) {
                alert('Something went wrong with the search');
                clearLoader();
            }
            
        }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});


elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if(btn) {
      const goToPage = parseInt(btn.dataset.goto, 10);  
      searchView.clearResults(); 
      searchView.renderResults(state.search.result, goToPage);
      console.log(goToPage)
    }
})

/**
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
    // Get ID from url
    const id = window.location.hash.replace('#', '');

    if(id) {
        // Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Higlight selected each search item
        if(state.search) searchView.highlightSelected(id);

        // Create new recipe object
        state.recipe = new Recipe(id);          

        try {
           // Get recipe data AND parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            //Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            // Render the recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
                );
        } catch (error) {
            console.log(err)
            alert('Error processing recipe')
        }       
    }
}

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * LIST CONTROLLER
 */

const controlList = () => {
    // Create a new list IF there is none yet
    if(!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
       // Delete from state
        state.list.deleteItem(id);

       // Delete from UI
       listView.deleteItem(id);

       //Handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

/**
 * LIKE CONTROLLER
 */

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    
    // User has NOT yet liked current recipe
    if(!state.likes.isLiked(currentID)) {
       
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        // Toggle the like button
        likeView.toggleLikeBtn(true);

        // Add like to the UI list
        likeView.renderLike(newLike);

    // User HAS liked current recipe
    } else {
        // Remove like from the state
        state.likes.deleteLike(currentID);

        // Remove the like button
        likeView.toggleLikeBtn(false);


        // Remove like from the UI list
        likeView.deleteLike(currentID);
        

    }
    likeView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipe on page load
window.addEventListener('load', () => {   
    state.likes = new Likes();
    
    // Restore likes
    state.likes.readStorage();
    
    // Toggle like menu button
    likeView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likeView.renderLike(like));
});

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if(state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }    
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }        
});


