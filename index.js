const ingredientInput = document.getElementById('ingredientInput');
const searchBtn = document.getElementById('searchBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultsSection = document.getElementById('resultsSection');
const recipesContainer = document.getElementById('recipesContainer');
const errorMessage = document.getElementById('errorMessage');
const recipeModal = document.getElementById('recipeModal');
const modalBody = document.getElementById('modalBody');
const closeBtn = document.querySelector('.close-btn');

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    searchBtn.addEventListener('click', handleSearch);
    
    ingredientInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
    
    closeBtn.addEventListener('click', closeModal);
    recipeModal.addEventListener('click', function(event) {
        if (event.target === recipeModal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
}

async function handleSearch() {
    const ingredients = ingredientInput.value.trim();
    
   
    if (ingredients === '') {
        showError('Please enter at least one ingredient!');
        return;
    }
    
    clearResults();
    hideError();
    
    showLoading();
    
    try {
        const ingredientList = ingredients.split(',')
            .map(ingredient => ingredient.trim())
            .filter(ingredient => ingredient !== '');
        
        const recipes = await searchRecipesByIngredient(ingredientList[0]);
        
        const filteredRecipes = filterRecipesByIngredients(recipes, ingredientList);
        
        hideLoading();
        
        if (filteredRecipes.length > 0) {
            displayRecipes(filteredRecipes);
        } else {
            showError(`No recipes found containing: ${ingredientList.join(', ')}. Try different ingredients!`);
        }
        
    } catch (error) {
        
        hideLoading();
        showError('Failed to fetch recipes. Please check your internet connection and try again.');
        console.error('Search error:', error);
    }
}

async function searchRecipesByIngredient(ingredient) {
    
    const apiUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.meals || [];
}

function filterRecipesByIngredients(recipes, ingredients) {
    
    if (ingredients.length === 1) {
        return recipes;
    }
    
    return recipes.filter(recipe => {
        return true;
    });
}

function displayRecipes(recipes) {
    
    recipesContainer.innerHTML = '';
    
    recipes.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe);
        recipesContainer.appendChild(recipeCard);
    });
    
    resultsSection.classList.remove('hidden');
}

function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    card.innerHTML = `
        <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="recipe-image" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
        <div class="recipe-info">
            <h3 class="recipe-title">${escapeHtml(recipe.strMeal)}</h3>
            <p class="recipe-category">Category: ${recipe.strCategory || 'Unknown'}</p>
            <button class="view-recipe-btn" onclick="viewRecipeDetails('${recipe.idMeal}')">View Recipe</button>
        </div>
    `;
    
    return card;
}

async function viewRecipeDetails(mealId) {
    showLoading();
    
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
        const data = await response.json();
        
        const recipe = data.meals[0];
        hideLoading();
        
        displayRecipeModal(recipe);
        
    } catch (error) {
        hideLoading();
        showError('Failed to load recipe details. Please try again.');
        console.error('Recipe details error:', error);
    }
}

function displayRecipeModal(recipe) {
    
    const ingredients = getIngredientsList(recipe);
    
    modalBody.innerHTML = `
        <h3>${escapeHtml(recipe.strMeal)}</h3>
        <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin: 1rem 0;">
        
        <div style="margin: 1.5rem 0;">
            <h4>Category: ${recipe.strCategory}</h4>
            <h4>Area: ${recipe.strArea}</h4>
        </div>
        
        <div style="margin: 1.5rem 0;">
            <h4>Ingredients:</h4>
            <ul>
                ${ingredients.map(ingredient => 
                    `<li>${escapeHtml(ingredient.measure)} ${escapeHtml(ingredient.ingredient)}</li>`
                ).join('')}
            </ul>
        </div>
        
        <div style="margin: 1.5rem 0;">
            <h4>Instructions:</h4>
            <p style="white-space: pre-line;">${escapeHtml(recipe.strInstructions)}</p>
        </div>
        
        ${recipe.strYoutube ? `
            <div style="margin: 1.5rem 0;">
                <h4>Video Tutorial:</h4>
                <a href="${recipe.strYoutube}" target="_blank" style="color: var(--accent-color);">Watch on YouTube</a>
            </div>
        ` : ''}
    `;
    
    recipeModal.classList.remove('hidden');
}

function getIngredientsList(recipe) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = recipe[`strIngredient${i}`];
        const measure = recipe[`strMeasure${i}`];
        
        if (!ingredient || ingredient.trim() === '') break;
        
        ingredients.push({
            ingredient: ingredient.trim(),
            measure: (measure || '').trim()
        });
    }
    
    return ingredients;
}

function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function clearResults() {
    recipesContainer.innerHTML = '';
    resultsSection.classList.add('hidden');
}

function closeModal() {
    recipeModal.classList.add('hidden');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}