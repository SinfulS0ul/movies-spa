const $listBlock = document.getElementsByClassName('films-block__list-block')[0];
const $filmInfo = document.getElementsByClassName('films-block__film-info')[0];
const $searchInput = document.getElementsByClassName('search-input')[0];
const $searchButton = document.getElementsByClassName('search-button')[0];

const $list = document.createElement('ul');
const $loadingText = document.createElement('p');
const $moreResults = document.createElement('p');
const $lessResults = document.createElement('p');

const API_KEY = '3072379740dd68944d857835e8a5785b';
const REQUESTS_LIMIT = 40;                            //  Maximum requests
const RECOMMENDATION_MAX = 6;                         //  Maximum movies in recommendation
const TIME_OF_TRENDS = 'day';                         //  View the trending list for the day/week.

let totalPages = 0;
let page = 1;
let movieMass = [];
let movieCount = 0;
const baseImageUrl = 'https://image.tmdb.org/t/p'     //  Base url for poster image
const imageSize = '/w342'                             //  Poster size

$loadingText.innerHTML = 'Wait, list is loading...';
$moreResults.innerHTML = 'Display all results';
$lessResults.innerHTML = 'Display less results';

const totalPagesGetting = (searchName) =>{
  let foundPages;
  //  Getting total pages of search request
  foundPages = fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=en-US&query=${searchName}&page=${page}&include_adult=false`)
    .then(res => res.json())
    .then(data => data.total_pages);

  return foundPages;
}

const findingMovies = async (searchName) => {
  page = 1;
  let totalPages = await totalPagesGetting(searchName);
  //  Reducing total pages to maximum request limit
  totalPages = totalPages > REQUESTS_LIMIT? REQUESTS_LIMIT: totalPages;
  //  Fetching every page
  while(totalPages--){
    await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=en-US&query=${searchName}&page=${page}&include_adult=false`)
      .then(res => res.json())
      .then(data => { movieMass = [...movieMass, ...data.results] })
    page++;
  }

  return movieMass;
}

const creatingList = () =>{
  $listBlock.appendChild($list);
  movieCount = movieMass.length;
  //  Creating movie/show list
  for(let i = 0; i < movieCount && i < 30; i++){
    const $listElement = document.createElement('li');
    $listElement.id = i;
    //  Adding title if it's movie or name if it's tv show
    $listElement.innerHTML = movieMass[i].title? movieMass[i].title: movieMass[i].name;
    $list.appendChild($listElement);
  }
  $listBlock.appendChild($moreResults);
}

const createRecommendations = (movieId) =>{
  //  Getting recommendations
  const recommendationMass = fetch(`https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${API_KEY}&language=en-US&page=1`)
    .then(res => res.json())
    .then(data =>  data.results);
  return recommendationMass;
}

$moreResults.addEventListener('click', ()=>{
  //  Render all results on the page
  for(let i = 30; i < movieCount; i++){
    const $listElement = document.createElement('li');
    $listElement.id = i;
    $listElement.innerHTML = movieMass[i].title;
    $list.appendChild($listElement);
  }

  $listBlock.removeChild($moreResults);
  $listBlock.appendChild($lessResults);
})

$lessResults.addEventListener('click', ()=>{
  //  Render only 30 first results on the page
  for(let i = movieCount - 1; i > 30; i--){
    const $listElement = document.getElementById(i);
    $list.removeChild($listElement);
  }

  $listBlock.removeChild($lessResults);
  $listBlock.appendChild($moreResults);
})

$list.addEventListener('click', async (e)=>{
  //  Removing old poster, title, description, recommendations from film-info block
  while ($filmInfo.firstChild) {
    $filmInfo.removeChild($filmInfo.firstChild);
  }
  //  Getting id of clicked element of list
  const movieNumber = e.target.id;

  const $filmImage = document.createElement('img');
  const $filmTextBlock = document.createElement('div');
  //  Getting last part of poster url
  const uniqImage = movieMass[movieNumber].poster_path;
  //  Creating full url of poster or setting empty image
  $filmImage.src = uniqImage? `${baseImageUrl}${imageSize}${uniqImage}`: 'Noimage.png';

  const $filmTitle = document.createElement('p');
  const $filmDescription = document.createElement('p');
  //  Getting film description
  $filmDescription.innerHTML = movieMass[movieNumber].overview;
  $filmDescription.className = 'description';
  //  Adding title if it's movie or name if it's tv show
  $filmTitle.innerHTML = movieMass[movieNumber].title? movieMass[movieNumber].title: movieMass[movieNumber].name;
  $filmTitle.className = 'title';

  $filmInfo.appendChild($filmImage);
  $filmInfo.appendChild($filmTextBlock);

  $filmTextBlock.appendChild($filmTitle);
  $filmTextBlock.appendChild($filmDescription);

  await addRecommendations(movieNumber, $filmTextBlock);
})

const addRecommendations = async (movieNumber, $filmTextBlock) => {
  const recommendationMass = await createRecommendations(movieMass[movieNumber].id);
  const $recommendationList = document.createElement('ul');
  const $filmRecommendations = document.createElement('p');

  $filmRecommendations.innerHTML = 'Recommendations:';
  $filmRecommendations.className = 'recommendations';

  $filmTextBlock.appendChild($filmRecommendations);
  $filmTextBlock.appendChild($recommendationList);
  //  Creating recommendation list
  for(let i = 0; i < recommendationMass.length && i < RECOMMENDATION_MAX; i++){
    const $listElement = document.createElement('li');
    $listElement.innerHTML = recommendationMass[i].title;
    $recommendationList.appendChild($listElement);
  }
}

$searchButton.addEventListener('click', async ()=>{
  let searchName = $searchInput.value.trim();
  //  Clearing old movies list and removing old elements
  movieCount = $listBlock.contains($lessResults)? movieCount--: 30;
  movieMass = [];

  while(movieCount--){
    const $listElement = document.getElementById(movieCount);
    $list.removeChild($listElement);
  }
  $listBlock.removeChild($moreResults);
  $listBlock.appendChild($loadingText);
  await findingMovies(searchName);
  $listBlock.removeChild($loadingText);
  $listBlock.appendChild($moreResults);
  //  Creating new list
  creatingList();
})

const createTrendingList = async () =>{
  $listBlock.appendChild($loadingText);
  //  Getting trending tv shows
  let mediaType = 'tv';
  await findTrendingMedia(mediaType);
  //  Getting trending movies
  mediaType = 'movie';
  await findTrendingMedia(mediaType);

  $listBlock.removeChild($loadingText);
  //  Creating new list
  creatingList();
}

const findTrendingMedia = async (mediaType) =>{
  //  Getting trending movies/tv shows
  await fetch(`https://api.themoviedb.org/3/trending/${mediaType}/${TIME_OF_TRENDS}?api_key=${API_KEY}`)
    .then(res => res.json())
    .then(data => movieMass = [...movieMass,...data.results])
}

createTrendingList();