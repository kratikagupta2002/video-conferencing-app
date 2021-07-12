const $canvas = $('body');
const $eyes = $('.eye');
const $rateInputs = $('.rate-input');


function vendorize(key, value) {
  const vendors = ['webkit', 'moz', 'ms', 'o', ''];
  var result = {};

  vendors.map(vendor => {
    const vKey = vendor ? '-' + vendor + '-' + key : key;

    result[vKey] = value;
  });

  return result;
}

//https://github.com/jfmdev/jqEye/blob/master/Source/jqeye.js
function circle_position(x, y, r) {
  // Circle: x^2 + y^2 = r^2
  var res = { x: x, y: y };
  if (x * x + y * y > r * r) {
    if (x !== 0) {
      var m = y / x;
      res.x = Math.sqrt(r * r / (m * m + 1));
      res.x = x > 0 ? res.x : -res.x;
      res.y = Math.abs(m * res.x);
      res.y = y > 0 ? res.y : -res.y;
    } else {
      res.y = y > 0 ? r : -r;
    }
  }
  return res;
};

function findCenter(coords, sizeX, sizeY) {
  return {
    x: coords.left + sizeX / 2,
    y: coords.top + sizeY / 2 };

}


function deltaVal(val, targetVal) {
  const delta = Math.min(100.0, ts - prevTs);
  const P = 0.001 * delta;

  return val + P * (targetVal - val);
}


function changeEyesPosition(px, py) {
  function changePosition() {
    const $t = $(this);
    const $pupil = $t.find('.pupil');
    const t_w = $t.width();
    const t_h = $t.height();
    const t_o = $t.offset();
    const t_p = $t.position();
    const abs_center = findCenter(t_o, t_w, t_h);
    const pos_x = px - abs_center.x + $(window).scrollLeft();
    const pos_y = py - abs_center.y + $(window).scrollTop();
    const cir = circle_position(pos_x, pos_y, t_w / 20);
    const styles = vendorize('transform', 'translateX(' + cir.x + 'px) translateY(' + cir.y + 'px)');

    $pupil.css(styles);
  }

  $eyes.each(changePosition);
}

function handleMouseMove(e) {
  const px = e.pageX,
  py = e.pageY;

  changeEyesPosition(px, py);
}

$canvas.on('mousemove', handleMouseMove);


function getFace($element) {
  return $element.parent('.face-wrapper').find('.face');
}


function handleFaceHover($face) {
  const $hint = $('.faces-hint');
  const hintText = $face.attr('data-hint') || $hint.attr('data-default-hint');
  $hint.text(hintText);
}


function handleFacesHover(e) {
  const $face = getFace($(e.target));

  handleFaceHover($face);
}

$('.feedback-faces').on('mousemove', handleFacesHover);



function handleFeedbackTitleHover(e) {
  const isHover = e.type === 'mouseenter';
  $(this).parent().toggleClass('title-hovered', isHover);
}

$('.feedback-title').on('mouseenter mouseleave', handleFeedbackTitleHover);


function handleFeedbackToggle() {
  const $this = $(this),
  $parent = $this.parent();

  $parent.toggleClass('at-bottom');

  $parent.find('.face-wrapper').each(function (index) {
    setTimeout(function (face) {
      face.toggleClass('slide-out-y-alt', $parent.hasClass('at-bottom'));
    }, (index - 1) * 40, $(this));
  });
}
$('.feedback-title').on('click', handleFeedbackToggle);



function handleRateInputChange() {
  const rating = parseInt($(this).val());

  getFace($rateInputs).addClass('grayscale');
  getFace($(this)).removeClass('grayscale');
  postRating(rating);
}

$rateInputs.on('change', handleRateInputChange);



//Firebase stuff

function setCounter(stats) {
  const $counters = $('.face-counter');

  function setTitle($counter, size) {
    var titleType = '',
    titlePrefix = '';
    if (size === 0) {
      titleType = 'none';
    } else if (size === 1) {
      titleType = 'one';
    } else {
      titleType = 'many';
      titlePrefix = `${size} `;
    }

    $counter.attr({
      'title': titlePrefix + $counter.attr(`data-title-${titleType}`) });

  }

  $counters.each(index => {
    const $counter = $counters.eq(index),
    size = stats[index] || 0;

    $counter.text(size);
    setTitle($counter, size);
    $counter.removeClass('invisible');
  });

}


function getTotalRating() {
  var stats = {};
  firebase.database().ref('votes').limitToLast(1000).once('value', snapshot => {
    snapshot.forEach(snap => {
      const val = snap.val();
      var voteStat = stats[val.vote];

      voteStat = voteStat ? voteStat + 1 : 1;
      stats[val.vote] = voteStat;

    });
    setCounter(stats);
  });
}


function postRating(rating) {
  const currentUser = firebase.auth().currentUser;

  if (currentUser) {
    const uid = currentUser.uid;
    const data = {
      vote: rating,
      time: new Date().getTime() };


    firebase.database().ref(`votes/${uid}`).set(data).then(getTotalRating);
  }
}


function loginFB() {
  console.log('login');
  firebase.auth().signInAnonymously().then(user => {
    console.log(firebase.auth().currentUser.uid);
  }).catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    if (errorCode === 'auth/operation-not-allowed') {
      alert('You must enable Anonymous auth in the Firebase Console.');
    } else {
      console.error(error);
    }
  });
}

function initFB() {
  var config = {
    apiKey: "AIzaSyABQEm9w0NTFxXOEqspp6iQUukNoSSV_rs",
    authDomain: "video-conferencing-app-dda1c.firebaseapp.com",
    databaseURL: "https://video-conferencing-app-dda1c-default-rtdb.firebaseio.com/",
    projectId: "video-conferencing-app-dda1c",
    storageBucket: "video-conferencing-app-dda1c.appspot.com",
    messagingSenderId: "980384311459" };

  firebase.initializeApp(config);
  //var database = firebase.database();

  if (!firebase.auth().currentUser) {
    loginFB();
  }

}

initFB();