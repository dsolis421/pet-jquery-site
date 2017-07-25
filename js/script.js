var $petfinderAPI = 'https://api.petfinder.com/';
var $devkey = '3c73470956892905e562a55f0e113f50';
var $selectedshelter = undefined;

function updateShelterStatus(message) {
  console.log(message);
  if(message) {
    $('#search-status').fadeOut("slow","swing", function() {
      $('#search-status').html('<h3>' + message + '</h3>')
        .fadeIn("slow","swing");
    });
  } else {
    $('#search-status').fadeOut("slow","swing", function() {
      $('#search-status').empty();
    });
  };
};

function evaluatePictures(photos, animal) {
  /*trying to ascertain if a usuable picture is available
  otherwise display default pic based on cat or dog*/
  var photoslength = photos.length;
  var goodphoto = '';
  var defaultphoto = animal === "dog" ? '../img/dogdefault_1.png' : '../img/catdefault_1.png';
  for(i = 0;i < photoslength;i++) {
    if(photos[i]['@size'] === "pn") {
      goodphoto = photos[i].$t;
      //console.log(goodphoto);
    }
  };
  return goodphoto != '' ? goodphoto : defaultphoto;
};

function renderSelectedShelter(shelter) {
  console.log('trying to render ', shelter.sheltername);
  $('#shelters').fadeOut("slow","swing", function() {
    $('#shelters').empty()
      .html('<div class="shelter-detail">\
          <div class="shelter-header">\
            <div class="shelter-name">\
              <h3>'+ shelter.sheltername +'</h3>\
            </div>\
            <div class="shelter-contact">\
              <h4>Address: ' + shelter.shelteraddress1  + ' ' +
                shelter.shelteraddress2 + ', ' +
                shelter.sheltercity + ', ' +
                shelter.shelterstate + '</h4>\
              <h4>Phone: ' + shelter.shelterphone + '</h4>\
              <h4>Email: ' + shelter.shelteremail + '</h4>\
            </div>\
          </div>\
          <div class="shelter-pets">\
          </div>\
        </div>')
      .fadeIn("slow","swing", function() {
        $('html, body').animate({
          scrollTop: $('#shelter-search').offset().top - 60
        }, 500);
        },getShelterPets(shelter.shelterid));
      });
}

function renderPet(pet) {
  console.log('rendering pet ', pet.petname);
  $('.shelter-pets').append('<div>\
      <figure>\
        <img src=' + pet.petimage + '/>\
        <figcaption>\
          <h4>' + pet.petname + '</h4>\
        </figcaption>\
      </figure>\
      <span>Sex: ' + pet.petsex + '</span>\
      <span>Breed: ' + pet.petbreed + '</span>\
    </div>');
}

function getShelter(id) {
  updateShelterStatus('Getting that family info...');
  $.getJSON($petfinderAPI + 'shelter.get?id=' + id + '&format=json&key=' + $devkey + '&callback=?')
    .done(function(shelterdata){
      shelterdetail = shelterdata.petfinder.shelter;
      var shelterObject = {
        shelterid: shelterdetail.id.$t,
        sheltername: shelterdetail.name.$t,
        shelteraddress1: shelterdetail.address1.$t ? shelterdetail.address1.$t : "Not available",
        shelteraddress2: shelterdetail.address2.$t ? shelterdetail.address2.$t : "",
        sheltercity: shelterdetail.city.$t ? shelterdetail.city.$t : "",
        shelterstate: shelterdetail.state.$t ? shelterdetail.state.$t : "",
        shelterphone: shelterdetail.phone.$t ? shelterdetail.phone.$t : "Not available",
        shelteremail: shelterdetail.email.$t ? shelterdetail.email.$t : "Not available"
      }
      //console.log('shelter object is ', shelterObject);
      $selectedshelter = shelterObject;
    })
    .error(function(err) {
      console.log('Get shelter by ID error! ' + err);
    });
};

function getSheltersZip(zip) {
  updateShelterStatus('Finding families...');
  $.getJSON($petfinderAPI + 'shelter.find?location=' + zip + '&format=json&count=24&key=' + $devkey + '&callback=?')
    .done(function(petApiData){
      //console.log(petApiData);
      if(petApiData.petfinder.hasOwnProperty('shelters')) {
        $('#shelters').fadeOut("slow","swing", function() {
          $('#shelters').empty();
          var shelters = petApiData.petfinder.shelters.shelter;
          for (i in shelters) {
            //abstract this render as a function accepting an object
            var listing = '<div class="shelter" shelterid=' + shelters[i].id.$t + '>\
                <h4>' + shelters[i].name.$t + '</h4>\
                <div>See Family</div>\
              </div>';
            $('#shelters').append(listing);
          };
          $('#shelters').fadeIn("slow","swing", function(){
            $('html, body').animate({
              scrollTop: $('#shelter-search').offset().top - 60
            }, 500);
          });
          $('.shelter').on("click", function() {
            getSelectedShelter($(this).attr('shelterid'));
          });
        });
        updateShelterStatus('Here\'s what we found...');
      } else {
        updateShelterStatus('Hmm... We didn\'t find any shelters. Please check the zip code and try again.');
        $('#shelters').fadeOut("slow","swing", function() {
          $('#shelters').empty();
        });
      }
    })
    .error(function(err){
      console.log('Get shelters by zip error! ' + err);
    });
};

function getShelterPets(id) {
  $.getJSON($petfinderAPI + 'shelter.getPets?id=' + id + '&output=full&format=json&key=' + $devkey + '&callback=?')
    .done(function(petApiData){
      console.log(petApiData);
      var rescues = petApiData.petfinder.pets.pet;
      var isReturnedDataArray = petApiData.petfinder.pets.hasOwnProperty('pet') && Array.isArray(petApiData.petfinder.pets.pet);
      var isReturnedDataObject = petApiData.petfinder.pets.hasOwnProperty('pet') && typeof petApiData.petfinder.pets.pet === 'object';
      //petfinder returns an object if only one pet exists, it returns an array of objects for multiple pets
      if(isReturnedDataArray) {
        console.log('found pets is an array');
        for (x in rescues) {
          //description data is random, holding off for now
          //var petdescription = rescues[x].description.$t ? rescues[x].description.$t.replace("'","\'") : "Not available";
          var petObject = {
            petname: rescues[x].name.$t,
            petsex: rescues[x].sex.$t,
            petbreed: rescues[x].breeds.breed.$t ? rescues[x].breeds.breed.$t : "Unknown",
            petimage: evaluatePictures(rescues[x].media.photos.photo, rescues[x].animal.$t)
          };
          renderPet(petObject);
        };
      } else if (isReturnedDataObject) {
        console.log('found pet is an object');
        var petObject = {
          petname: rescues.name.$t,
          petsex: rescues.sex.$t,
          petbreed: rescues.breeds.breed.$t ? rescues.breeds.breed.$t : "Unknown",
          petimage: evaluatePictures(rescues.media.photos.photo, rescues.animal.$t)
        };
        renderPet(petObject);
      } else {
        console.log('looked for pets but none found');
        $('.shelter-pets').append('<h4>Looks like there are no pets currently at this shelter</h4>');
      }
    })
    .error(function(err){
      console.log('Get shelters by zip error! ' + err);
    });
}

function getSelectedShelter(id) {
  console.log('selected shelter id', id);
  $selectedshelter = getShelter(id);
  //could not figure out a way to make this async after getShelter
  var timer = setInterval(function(){
    console.log('waiting on shelter ', $selectedshelter);
    if($selectedshelter){
      renderSelectedShelter($selectedshelter);
      updateShelterStatus(null);
      clearInterval(timer);
      return;
    }
  }, 500);
}

function lazyLoadIntro() {
  setTimeout(function(){
    $('#rescue-nav, #intro > div').css("opacity","1");
    if($(window).width() <= 437){
      $('#rescue-nav').css('background','#005005');
    }
  }, 700);
}

$(document).ready(function() {

  lazyLoadIntro();

  $(function() {
    $('a[href*="#"]:not([href="#"])').click(function() {
      if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
        var target = $(this.hash);
        target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
        if (target.length) {
          $('html, body').animate({
            scrollTop: target.offset().top - 35
          }, 500);
          return false;
        }
      }
    });
  });

  $('#shelter-searchgo').click(function(){
    var zip = $('#shelter-search').val()
    if(zip.length === 5) {
      console.log('searching ', zip);
      getSheltersZip(zip);
    } else {
      updateShelterStatus('Oops! That doesn\'t look like a valid zip code.');
    }
  });

  $(document).scroll(function(){
    var $scroll = $(document).scrollTop();
    if ($scroll > 300) {
      $('#rescue-nav').css('background','#005005');
    } else if ($scroll == 0 && $(window).width() > 437) {
      $('#rescue-nav').css('background','none');
    }
  });

  $('#rescue-navbar-collapse a, #logo').click(function(){
    $('#rescue-navbar-collapse').removeClass("in");
    $('#rescue-navbar-collapse').attr("aria-expanded",false);
  });
});
