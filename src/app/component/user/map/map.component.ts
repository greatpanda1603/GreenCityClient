import {Component, OnInit, ViewChild} from '@angular/core';
import {LatLngBounds} from '@agm/core';
import {Place} from '../../../model/place/place';
import {MapBounds} from '../../../model/map/map-bounds';
import {PlaceService} from '../../../service/place/place.service';
import {PlaceInfo} from '../../../model/place/place-info';
import {MatIconRegistry} from '@angular/material';
import {DomSanitizer} from '@angular/platform-browser';
import {FavoritePlaceService} from '../../../service/favorite-place/favorite-place.service';
import {FavoritePlaceSave} from '../../../model/favorite-place/favorite-place-save';
import {FilterPlaceService} from '../../../service/filtering/filter-place.service';
import {UserService} from '../../../service/user/user.service';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';

interface Location {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  placeInfo: PlaceInfo;
  button = false;
  searchText;
  lat = 49.841795;
  lng = 24.031706;
  zoom = 13;
  userMarkerLocation: Location;
  map: any;
  isFilter = false;
  origin: any;
  destination: any;
  directionButton: boolean;
  navigationMode = false;
  navigationButton = 'Navigate to place';
  travelMode = 'WALKING';
  travelModeButton = 'DRIVING';
  distance;
  icon = 'assets/img/icon/blue-dot.png';
  color = 'star-yellow';
  markerYellow = 'assets/img/icon/favorite-place/Icon-43.png';
  querySubscription: Subscription;
  idFavoritePlace: number;
  favoritePlaces: FavoritePlaceSave[];
  circleRadius;

  constructor(private iconRegistry: MatIconRegistry,
              private sanitizer: DomSanitizer,
              private uService: UserService,
              private route: ActivatedRoute,
              private placeService: PlaceService,
              private filterService: FilterPlaceService,
              private favoritePlaceService: FavoritePlaceService) {
    iconRegistry
      .addSvgIcon(
        'star-white'
        ,
        sanitizer
          .bypassSecurityTrustResourceUrl(
            'assets/img/icon/favorite-place/star-white.svg'
          ));
    iconRegistry
      .addSvgIcon(
        'star-yellow'
        ,
        sanitizer
          .bypassSecurityTrustResourceUrl(
            'assets/img/icon/favorite-place/star-yellow.svg'
          ));
    this.filterService.setCategoryName('Food');
    this.filterService.setSpecName('Own cup');
    this.querySubscription = route.queryParams.subscribe(
      (queryParam: any) => {
        this.idFavoritePlace = queryParam.fp_id;
      });
  }

  getDirection(p: Place) {
    if (this.navigationMode === false) {
      this.navigationButton = 'Close navigation';
      this.navigationMode = true;
      this.destination = {lat: p.location.lat, lng: p.location.lng};
      this.origin = {lat: this.userMarkerLocation.lat, lng: this.userMarkerLocation.lng};
    } else {
      this.navigationMode = false;
      this.navigationButton = 'Navigate to place';
    }
  }


  ngOnInit() {
    this.filterService.mapBounds = new MapBounds();
    this.userRole = this.uService.getUserRole();
    this.setCurrentLocation();
    this.userMarkerLocation = {lat: this.lat, lng: this.lng};
    if (this.userRole === 'ROLE_ADMIN' || this.userRole === 'ROLE_MODERATOR' || this.userRole === 'ROLE_USER') {
      this.getFavoritePlaces();
    }
  }

  setCurrentLocation(): Position {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
        this.zoom = 13;
        this.userMarkerLocation = {lat: this.lat, lng: this.lng};
        return position;
      });
    }
    return null;
  }

  boundsChange(latLngBounds: LatLngBounds) {
    this.filterService.setMapBounds(latLngBounds);
  }

  setMarker(place: any) {
    this.button = true;
    this.placeService.places = null;
    this.placeService.places = [place];
  }

  showAllPlaces() {
    this.origin = null;
    this.button = !this.button;
    this.placeService.getListPlaceByMapsBoundsDto(this.mapBounds).subscribe((res) => {
      this.place = res;
    });
    this.searchText = null;
  }

  clearFilters() {
    this.filterService.clearDiscountRate();
    this.placeService.getFilteredPlaces();
  }

  showDetail(pl: Place) {
    this.directionButton = true;
    this.placeService.getPlaceInfo(pl.id).subscribe((res) => {
        this.placeInfo = res;
        if (this.userRole === 'ROLE_ADMIN' || this.userRole === 'ROLE_MODERATOR' || this.userRole === 'ROLE_USER') {
          if (this.userRole === null) {
            this.favoritePlaces.forEach(fp => {
              if (fp.placeId === this.placeInfo.id) {
                this.placeInfo.name = fp.name;
              }
            });
          }
        }
      }
    );
    this.placeService.places = this.placeService.places.filter(r => {
      return r.id === pl.id;
    });
    if (this.placeService.places.length === 1 && this.button !== true) {
      this.button = !this.button;
    }
    pl.color = this.getIcon(pl.favorite);
  }

  savePlaceAsFavorite(place: Place) {
    console.log('savePlaceAsFavorite() method in map.component placeId=' + place.id);
    if (!place.favorite) {
      this.favoritePlaceService.saveFavoritePlace(new FavoritePlaceSave(place.id, place.name)).subscribe(res => {
          this.getFavoritePlaces();
        }
      )
      ;
      place.favorite = true;
      place.color = this.getIcon(place.favorite);

    } else {
      this.favoritePlaceService.deleteFavoritePlace(place.id * (-1)).subscribe(res => {
        this.getFavoritePlaces();
      })
      ;
      place.favorite = false;
      place.color = this.getIcon(place.favorite);
    }
  }

  getIcon(favorite: boolean) {
    return favorite ? 'star-yellow' : 'star-white';
  }

  getList() {
    if (this.button !== true) {
      this.placeService.getListPlaceByMapsBoundsDto(this.mapBounds).subscribe((res) => this.place = res);
      this.searchText = null;
    }
  }

  checkIfUserLoggedIn() {
    if (this.userRole === 'ROLE_ADMIN' || this.userRole === 'ROLE_MODERATOR' || this.userRole === 'ROLE_USER') {
      this.changePlaceToFavoritePlace();
    }
  }

  toggleFilter() {
    this.isFilter = !this.isFilter;
    if (this.circleRadius) {
      this.circleRadius = null;
    }
  }

  getMarkerIcon(favorite: boolean) {
    if (favorite) {
      return this.markerYellow;
    } else {
      return null;
    }
  }

  setFavoritePlaceOnMap() {
    if (this.idFavoritePlace) {
      this.favoritePlaceService.getFavoritePlaceWithLocation(this.idFavoritePlace).subscribe((res) => {
          res.favorite = true;
          this.placeService.places = [res];
          this.setMarker(this.placeService.places[0]);
        }
      );
      this.idFavoritePlace = null;

    }
  }

  getFavoritePlaces() {
    console.log('getFavoritePlaces');
    this.favoritePlaceService.findAllByUserEmailWithPlaceId().subscribe((res) => {
        this.favoritePlaces = res;
      }
    );
  }

  changePlaceToFavoritePlace() {
    this.placeService.places.forEach((place) => {
      place.favorite = false;
      this.favoritePlaces.forEach((favoritePlace) => {
        if (place.id === favoritePlace.placeId) {
          place.name = favoritePlace.name;
          place.favorite = true;
        }
      });
    });
  }

  setLocationToOrigin(location) {
    this.userMarkerLocation.lat = location.coords.lat;
    this.userMarkerLocation.lng = location.coords.lng;
    if (this.place.length === 1) {
      this.destination = {lat: this.place[0].location.lat, lng: this.place[0].location.lng};
      this.origin = {lat: this.userMarkerLocation.lat, lng: this.userMarkerLocation.lng};
    }
  }

  changeTravelMode() {
    this.travelMode = (this.travelMode === 'WALKING') ? 'DRIVING' : 'WALKING';
    this.travelModeButton = (this.travelModeButton === 'DRIVING') ? 'WALKING' : 'DRIVING';
  }


  setRadiusCircle(event: any) {
    this.circleRadius = Number(event) * 1000;
  }
}
