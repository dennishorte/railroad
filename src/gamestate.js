var Action  = {};
var Cards   = {};  // Not exported
var City    = {};
var Color   = {};
var Factory = {};
var Game    = {};
var Map     = {};
var Player  = {};
var Util    = {};

(function() {
    exports.Action  = Action;
    exports.Cards   = Cards;
    exports.City    = City;
    exports.Color   = Color;
    exports.Factory = Factory;
    exports.Game    = Game;
    exports.Map     = Map;
    exports.Player  = Player;
    exports.Util    = Util;
}());

(function() {
    Util.assert = function(condition, message) {
        if (!condition) {
            message = message || "Assertion failed";
            if (typeof Error !== "undefined") {
                throw new Error(message);
            }
            throw message; // Fallback
        }
    };

    Util.default_arg = function(arg, default_value) {
        return (typeof arg !== 'undefined') ? arg : default_value;
    };

    Util.not_ready = function() {
        message = "Not yet implemented.";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    };

    Util.random_int = function(max) {
        return Math.floor(Math.random() * max);
    };



    Util.Array = {};

    Util.Array.back = function(array) {
        return array[array.length - 1];
    };

    Util.Array.contains = function(array, element) {
        return array.indexOf(element) >= 0;
    };

    /**
     Returns an array of the removed elements.
     */
    Util.Array.remove = function(array, element) {
        var index = array.indexOf(element);
        if (index == -1) {
            return [];
        }
        else {
            return array.splice(index, 1);
        }
    };

    Util.Array.select = function(array) {
        return array[Util.random_int(array.length)];
    };

    Util.Array.shuffle = function (array) {
        var currentIndex = array.length;
        var temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    };

}());

(function() {
    Cards.MajorTypes = {
        ETERNAL     : 1,
        ACHIEVEMENT : 2,
        ACTION      : 3,
        IMMEDIATE   : 4,
    };

    Cards.MinorTypes = {
        HOTEL          : 1,
        MAJOR_LINE     : 2,
        SERVICE_BOUNTY : 3,
        RAILROAD_ERA   : 4,
        SPEED_RECORD   : 5,
        NEW_TRAIN      : 6,
        LAND_GRANT     : 7,
        NEW_INDUSTRY   : 8,
        EXECUTIVE      : 9,
        PERFECT_ENG    : 10,
        CITY_GROWTH    : 11,
    };

    var f = {};
    Cards.Factory = f;

    f[Cards.MinorTypes.SERVICE_BOUNTY] = function(city, points) {
        return {
            major_type: Cards.MajorTypes.ACHIEVEMENT,
            minor_type: Cards.MinorTypes.SERVICE_BOUNTY,
            name: "Service Bounty: " + city.name,
            text: "The first player to deliver a goods cube to " + city.name + " gains " + points.toString() + " points.",
            city_id: city.id,
            points: points,
        };
    };

    f[Cards.MinorTypes.HOTEL] = function(city) {
        return {
            major_type: Cards.MajorTypes.ETERNAL,
            minor_type: Cards.MinorTypes.HOTEL,
            name: "Hotel: " + city.name,
            text: "Gain 1 point on the income track for each goods cube delivered to " + city.name + "(regardless of which player makes the delivery).",
            city_id: city.id,
        };
    };

    f[Cards.MinorTypes.MAJOR_LINE] = function(city1, city2, points, with_link) {
        var link_text = with_link ? " (with a western link)" : "";

        return {
            major_type: Cards.MajorTypes.ACHIEVEMENT,
            minor_type: Cards.MinorTypes.MAJOR_LINE,
            name: "Major Line: " + city1.name + " to " + city2.name,
            text: "The first player to connect " + city1.name + " and " + city2.name + link_text + " gains " + points.toString() + " on the income track.",
            city1_id: city1.id,
            city2_id: city2.id,
            points: points,
            with_link: with_link,
        };
    };

    f[Cards.MinorTypes.RAILROAD_ERA] = function() {
        return {
            name: "The Railroad Era Begins",
            text: "The first player to deliver a goods cube gains 1 additional point on the income track.",
            major_type: Cards.MajorTypes.ACHIEVEMENT,
            minor_type: Cards.MinorTypes.RAILROAD_ERA,
            starting: true,
            points: 1,
        };
    };

    f[Cards.MinorTypes.SPEED_RECORD] = function() {
        return {
            name: "Speed Record",
            text: "The first player to make a 3-link delivery gains 3 additional points on the income track.",
            major_type: Cards.MajorTypes.ACHIEVEMENT,
            minor_type: Cards.MinorTypes.SPEED_RECORD,
            starting: true,
            points: 3,
        };
    };

    f[Cards.MinorTypes.NEW_TRAIN] = function() {
        return {
            name: "New Train",
            text: "The first player to upgrade to a level 4 train gains 4 points on the income track.",
            major_type: Cards.MajorTypes.ACHIEVEMENT,
            minor_type: Cards.MinorTypes.NEW_TRAIN,
            starting: true,
            points: 4,
        };
    };

    f[Cards.MinorTypes.LAND_GRANT] = function() {
        return {
            name: "Government Land Grant",
            text: "All track built on open terrain during a single future build track action is free.",
            major_type: Cards.MajorTypes.ACTION,
            minor_type: Cards.MinorTypes.LAND_GRANT,
        };
    };

    f[Cards.MinorTypes.NEW_INDUSTRY] = function() {
        return {
            name: "New Industry",
            text: "Immediately place a free 'New City' tile in the gray city of your choice.",
            major_type: Cards.MajorTypes.IMMEDIATE,
            minor_type: Cards.MinorTypes.NEW_INDUSTRY,
        };
    };

    f[Cards.MinorTypes.EXECUTIVE] = function() {
        return {
            name: "Railroad Executive",
            text: "The player taking this card may immediately take 2 actions.",
            major_type: Cards.MajorTypes.IMMEDIATE,
            minor_type: Cards.MinorTypes.EXECUTIVE,
        };
    };

    f[Cards.MinorTypes.PERFECT_ENG] = function() {
        return {
            name: "Perfect Engineering",
            text: "Lay up to 5 track segments in a single link.",
            major_type: Cards.MajorTypes.ETERNAL,
            minor_type: Cards.MinorTypes.PERFECT_ENG,
        };
    };

    f[Cards.MinorTypes.CITY_GROWTH] = function() {
        return {
            name: "City Growth",
            text: "Add 2 new random goods cubes to any single city of your choice.",
            major_type: Cards.MajorTypes.IMMEDIATE,
            minor_type: Cards.MinorTypes.CITY_GROWTH,
        };
    };

    /**
     Takes as arguments a bunch of Cards.MinorTypes, one for each card in the deck. If the
     MinorType requires arguments, it is assumed that the next element passed into the
     function will be an array of the args.
     */
    Cards.DeckFactory = function() {
        var deck = [];

        for (var i = 0; i < arguments.length; i++) {
            var f = Cards.Factory[arguments[i]];
            if (f.length > 0) {
                deck.push(f.apply(this, arguments[i + 1]));
                i++;
            }
            else {
                deck.push(f());
            }
        }
        for (var i = 0; i < deck.length; i++) {
            deck[i].id = i + 1;
        }

        return deck;
    };
}());

(function() {
    Factory.Hex = function(row, col) {
        return {
            row: row,
            col: col,
        };
    };

    Factory.Cubes = function() {
        var dict = {};
        for (var i = 0; i < Color.cubes.length; i++) {
            dict[Color.cubes[i]] = 0;
        }
        return dict;
    };

    Factory.City = function() {
        return {
            id    : -1,
            name  : "",
            row   : -1,   // Position on the map.
            col   : -1,   // Position on the map.
            size  : -1,   // Number of cubes it starts with.
            color : Color.colors.INVALID,
            cubes : Factory.Cubes(),
            western_link: City.WesternLinkState.NONE,
        };
    };

    /**
     The hexes in a map should always be designed to that the even rows are offset to the
     right from the odd rows. eg.
       0,0  0,1  0,2  0,3  0,4
         1,0  1,1  1,2  1,3  1,4
       2,0  2,1  2,2  2,3  2,4
         3,0  3,1  3,2  3,3  3,4
       4,0  4,1  4,2  4,3  4,4
     */
    Factory.Map = function() {
        return {
            rows: 0,
            cols: 0,
            hexes: [],   // 2-d array of Map.Terrain elements
            ridges: [],  // List of ridge positions. Each entry is a pair of hexes [h1, h2].
            cities: [],  // Index equals id.
        };
    };

    Factory.Settings = function() {
        return {
            players: [],
            map: {},
        };
    };

    Factory.Player = function() {
        return {
            id      : -1,  // This is the user_id in the overall system. Not game specific.
            shares  :  0,  // Number of shares sold.
            money   :  0,  // In thousands
            points  :  0,  // For looking up income. Not final score.
            engine  :  1,  // Level of this player's engine.
            bid     :  0,  // Used only during bidding
            cards   : [],  // Cards this player is holding (ids)
            land_grant: false,  // true if the player used a land grant card this turn.
            executive : false,  // true if player used executive card and no other actions yet.
        };
    };

    Factory.Track = function() {
        return {
            id       : -1,
            owner    : -1,
            path     : [],
            complete : false,
        };
    };

    /**
     The deck in the game state is tightly linked to the map, since many cards reference
     cities on the map. I made the decision not to put it directly on the map because a map
     can also have different decks (eg. the difference between the original Railroad Tycoon
     and the newer Railways of the World).
     */
    Factory.GameState = function() {
        return {
            players       : [],  // An array of player objects.
            tracks        : [],  // An array of track objects.
            map           : {},  // A Factory.Map object.
            deck          : [],  // The cards for this game.
            active_cards  : [],  // Cards available for players to take/use (ids).
            cards_dealt   : [],  // A list of card ids that have been drawn/dealt from the deck.
            first_seat    :  0,  // changes each turn
            current_seat  :  0,
            round         :  0,  // 3 rounds per turn + round 0 = bidding for first player
            turn          :  1,  // no turn limit, but nice for logging
        };
    }

}());

(function() {
    Color.colors = {
        INVALID: 0,
        RED    : 1,
        YELLOW : 2,
        BLUE   : 3,
        PURPLE : 4,
        BLACK  : 5,
        GRAY   : 6,
        properties : {
            0: { name: "invalid" },
            1: { name: "red"     },
            2: { name: "yellow"  },
            3: { name: "blue"    },
            4: { name: "purple"  },
            5: { name: "black"   },
            6: { name: "gray"    },
        },
    };

    // The colors that can be selected for the urbanize action.
    Color.urbanize_colors = [
        Color.colors.YELLOW,
        Color.colors.BLUE,
        Color.colors.PURPLE,
        Color.colors.BLACK,
    ];

    // All possible cube colors.
    Color.cubes = [
        Color.colors.RED,
        Color.colors.YELLOW,
        Color.colors.BLUE,
        Color.colors.PURPLE,
        Color.colors.BLACK,
    ];

}());

(function() {
    City.WesternLinkState = {
        NONE    : 0,
        POSSIBLE: 1,
        BUILT   : 2,
        DEST    : 3,  // A city where red cube deliveries cause extra stuff to appear.
    };
    
    /**
     @return the location of the city as a hex dict.
     */
    City.get_hex = function(city) {
        return {
            row: city.row,
            col: city.col,
        };
    };

    City.get_size = function(city) {
        return city.size;
    };

    City.num_cubes_remaining = function(city) {
        var count = 0;
        for (var i = 0; i < Color.cubes.length; i++) {
            count += city.cubes[Color.cubes[i]];
        }
        return count;
    };

}());

(function() {
}());

(function() {
    Map.Terrain = {
        INVALID : 0,
        CITY    : 1,
        RIVER   : 2,
        OCEAN   : 3,
        PLAINS  : 4,
        HILLS   : 5,

        /**
         name: A human-readable string representing the type of terrain.
         cost: The amount of cash required to build a track on that terrain. null means no
               building is possible.
         */
        properties : {
            0: { name: "invalid", cost: null },
            1: { name: "city"   , cost: null },
            2: { name: "river"  , cost: 3    },
            3: { name: "ocean"  , cost: null },
            4: { name: "plains" , cost: 2    },
            5: { name: "hills"  , cost: 4    },
        },

        RIDGE_COST      : 4,
        HALF_RIDGE_COST : 2,
        CROSSING_COST   : 2,
    };

    Map.Direction = {
        INVALID: 0,
        NE : (1 << 0),
        E  : (1 << 1),
        SE : (1 << 2),
        SW : (1 << 3),
        W  : (1 << 4),
        NW : (1 << 5),
    };

    Map.Direction.reverse = {};
    Map.Direction.reverse[Map.Direction.NE] = Map.Direction.SW;
    Map.Direction.reverse[Map.Direction.E ] = Map.Direction.W;
    Map.Direction.reverse[Map.Direction.SE] = Map.Direction.NW;
    Map.Direction.reverse[Map.Direction.SW] = Map.Direction.NE;
    Map.Direction.reverse[Map.Direction.W ] = Map.Direction.E;
    Map.Direction.reverse[Map.Direction.NW] = Map.Direction.SE;

    Map.Direction.adjacent = {};
    Map.Direction.adjacent[Map.Direction.NE] = [Map.Direction.NW, Map.Direction.E ];
    Map.Direction.adjacent[Map.Direction.E ] = [Map.Direction.NE, Map.Direction.SE];
    Map.Direction.adjacent[Map.Direction.SE] = [Map.Direction.E , Map.Direction.SW];
    Map.Direction.adjacent[Map.Direction.SW] = [Map.Direction.SE, Map.Direction.W ];
    Map.Direction.adjacent[Map.Direction.W ] = [Map.Direction.SW, Map.Direction.NW];
    Map.Direction.adjacent[Map.Direction.NW] = [Map.Direction.W , Map.Direction.NE];

    Map.Direction.is_adjacent = function(dir1, dir2) {
        var adj = Map.Direction.adjacent[dir1];
        for (var i = 0; i < adj.length; i++) {
            if (adj[i] == dir2) return true;
        }
        return false;
    };

    /**
     A train track cannot make a curve that is too sharp. Thus, a E -> W movement, which
     would turn the train 180 degrees, is not valid, but also E -> SW, which would turn
     the train 120 degrees is also too sharp. A curve can have a maximum of 60 degrees to
     be valid.
     */
    Map.Direction.is_valid_curve = function(dir1, dir2) {
        Util.assert(dir1 != Map.Direction.INVALID && dir2 != Map.Direction.INAVLID, "Invalid directions.");

        return dir1 == dir2 || Map.Direction.is_adjacent(dir1, dir2);
    };

    Map.Hex = {};

    Map.Hex.is_equal = function(hex1, hex2) {
        return hex1.row == hex2.row && hex1.col == hex2.col
    };

    /**
     Test that the city ids all line up correctly with the array indices that hold them.
     */
    Map.check_city_ids = function(map) {
        for (var i = 0; i < Map.num_cities(map); i++) {
            Util.assert(map.cities[i].id == i, "Invalid city id.");
        }
    };

    /**
     Test that the location of each city on the map corresponds to a city in its cities list.
     */
    Map.check_city_locations = function(map) {
        for (var i = 0; i < Map.num_cities(map); i++) {
            var city = map.cities[i];
            Util.assert(Map.is_city(map, City.get_hex(city)), "City terrain type is incorrect.");
        }
    };

    Map.get_cities = function(map) {
        return map.cities;
    };

    Map.get_city_by_id = function(map, city_id) {
        return map.cities[city_id];
    };

    Map.get_city_by_hex = function(map, hex) {
        for (var i = 0; i < map.cities.length; i++) {
            var city = map.cities[i];
            if (city.row == hex.row && city.col == hex.col) {
                return city;
            }
        }
        Util.assert(false, "No city found at hex.");
    };

    Map.get_city_at_other_end_of_track = function(map, track, city_id) {
        Util.assert(track.complete, "Track is not complete.");
        var city = Map.get_city_by_id(map, city_id);
        var city_hex = City.get_hex(city);
        if (Map.Hex.is_equal(track.path[0], city_hex)) {
            return Map.get_city_by_hex(map, Util.Array.back(track.path));
        }
        else {
            return Map.get_city_by_hex(map, track.path[0]);
        }
    };

    Map.get_terrain = function(map, hex) {
        return map.hexes[hex.row][hex.col];
    };

    Map.num_cities = function(map) {
        return map.cities.length;
    };

    Map.seed_cubes = function(map) {
        for (var i = 0; i < Map.num_cities(map); i++) {
            var city = map.cities[i];
            for (var j = 0; j < City.get_size(city); j++) {
                var color = Util.Array.select(Color.cubes);
                city.cubes[color] += 1;
            }
        }
    };

    Map.crosses_ridge = function(map, hex1, hex2) {
        for (var i = 0; i < map.ridges.length; i++) {
            var ridge = map.ridges[i];
            if (Map.Hex.is_equal(hex1, ridge[0]) && Map.Hex.is_equal(hex2, ridge[1])) {
                return true;
            }
            else if (Map.Hex.is_equal(hex2, ridge[0]) && Map.Hex.is_equal(hex1, ridge[1])) {
                return true;
            }
        };
        return false;
    };

    Map.is_city = function(map, hex) {
        return Map.get_terrain(map, hex) == Map.Terrain.CITY;
    };

    /**
     Determine the direction from hex1 to hex2, if they are adjacent. Return invalid if
     they are not adjacent.

       0,0  0,1  0,2
         1,0  1,1  1,2
       2,0  2,1  2,2
     */
    Map.adjacency = function(map, hex1, hex2) {
        var d = Map.Direction;
        var dr = hex2.row - hex1.row;
        var dc = hex2.col - hex1.col;

        if (dr == 0) {
            if (dc == -1) return d.W;
            if (dc == +1) return d.E;
            return d.INVALID;
        }

        if (hex1.row % 2 == 0) {
            if (dr == -1) {
                if (dc ==  0) return d.NE;
                if (dc == -1) return d.NW;
                return d.INVALID;
            }
            if (dr == +1) {
                if (dc ==  0) return d.SE;
                if (dc == -1) return d.SW;
                return d.INVALID;
            }
        }
        else {
            if (dr == -1) {
                if (dc == +1) return d.NE;
                if (dc ==  0) return d.NW;
                return d.INVALID;
            }
            if (dr == +1) {
                if (dc == +1) return d.SE;
                if (dc ==  0) return d.SW;
                return d.INVALID;
            }
        }
        return d.INVALID;
    };

    Map.is_on_map = function(map, hex) {
        return 0 <= hex.row && hex.row < map.rows && 0 <= hex.col && hex.col < map.cols;
    };

    /**
     This specifically does NOT check the endpoints.

     If the path is not valid, throws an error.
     */
    Map.is_valid_path = function(map, path) {
        Util.assert(path.length > 2, "Path is too short.");

        for (var i = 1; i < path.length - 1; i++) {
            var hex = path[i];

            Util.assert(
                0 <= hex.row && hex.row < map.rows &&
                0 <= hex.col && hex.col < map.cols,
                "Hex is off the map.");

            Util.assert(
                !Map.is_city(map, hex),
                "Path passes through city.");

            Util.assert(
                Map.get_terrain(map, hex) != Map.Terrain.INVALID,
                "Path crosses invaid terrain.");

        }

        var prev_adj = null;
        for (var i = 1; i < path.length; i++) {
            var prev = path[i - 1];
            var next = path[i];
            var adj = Map.adjacency(map, prev, next);
            Util.assert(adj != Map.Direction.INVALID, "Path is not contiguous.");
            if (prev_adj != null) {
                Util.assert(Map.Direction.is_valid_curve(prev_adj, adj), "Invalid curve in path.");
            }
            prev_adj = adj;
        }

        for (var i = 0; i < path.length; i++) {
            for (var j = i + 1; j < path.length; j++) {
                Util.assert(!Map.Hex.is_equal(path[i], path[j]), "Path contains loop.");
            }
        }

        // ...too many tracks (max two tracks per hex).

        return true;
    };

}());

(function() {
    Map.Builder = {};

    Map.Builder.initialize_terrain = function(map, rows, cols) {
        Util.assert(map.hexes.length == 0, "Terrain has already been initialized.");
        map.rows = rows;
        map.cols = cols;
        for (var row = 0; row < rows; row++) {
            map.hexes.push([]);
            for (var col = 0; col < cols; col++) {
                map.hexes[row].push(Map.Terrain.PLAINS);
            }
        }
    };

    Map.Builder.insert_city = function(map, city, row, col) {
        Util.assert(row < map.rows && col < map.cols, "Invalid position for city.");
        city.row = row;
        city.col = col;
        city.id = map.cities.length;
        map.cities.push(city);
        map.hexes[row][col] = Map.Terrain.CITY;
    };

    Map.Builder.set_terrain_type = function(map, type, row, col) {
        Util.assert(row < map.rows && col < map.cols, "Invalid map location.");
        map.hexes[row][col] = type;
    };

    Map.Builder.add_ridge = function(map, row1, col1, row2, col2) {
        Util.assert(row1 < map.rows && col1 < map.cols, "Invalid map location A.");
        Util.assert(row2 < map.rows && col2 < map.cols, "Invalid map location B.");
        var ridge = [
            Factory.Hex(row1, col1),
            Factory.Hex(row2, col2),
        ];
        map.ridges.push(ridge);
    };
}());

(function() {
    Player.get_bid = function(player) {
        return player.bid;
    };

    Player.set_bid = function(player, amount) {
        player.bid = amount;
    };

    Player.clear_bid = function(player) {
        player.bid = 0;
    };

    Player.has_passed_bidding = function(player) {
        return player.bid < 0;
    };

    Player.set_passed_bidding = function(player) {
        player.bid = -1;
    };

    Player.get_money = function(player) {
        return player.money;
    };

    Player.adjust_money = function(player, delta) {
        player.money += delta;
    };

    Player.get_shares = function(player) {
        return player.shares;
    };

    Player.add_share = function(player) {
        player.shares += 1;
    };

    Player.get_score = function(player) {
        return player.points;
    };

    Player.add_points = function(player, points) {
        player.points += points;
    };

    Player.get_engine = function(player) {
        return player.engine;
    };

    Player.increment_engine = function(player) {
        player.engine += 1;
    };

    Player.get_cards = function(player) {
        return player.cards;
    };

    Player.add_card = function(player, card_id) {
        player.cards.push(card_id);
    };

    Player.remove_card = function(player, card_id) {
        Util.Array.remove(player.cards, card_id);
    };

    Player.set_land_grant = function(player, value) {
        player.land_grant = value;
    };

    Player.get_land_grant = function(player) {
        return player.land_grant;
    };

    Player.set_executive = function(player, value) {
        player.executive = value;
    };

    Player.get_executive = function(player) {
        return player.executive;
    };

}());

(function() {
    Game.BiddingRound = 0;
    Game.NumRounds    = 3; // Actual number of play rounds (doesn't include bidding).

    Game.score_to_income = {
         0: 0,  1: 3,  2: 4,  3: 5,  4: 6,
         5: 7,  6: 8,  7: 9,  8:10,  9:11,
        10:12, 11:13, 12:14, 13:15, 14:15,
        15:16, 16:16, 17:17, 18:17, 19:18,
        20:18, 21:19, 22:19, 23:19, 24:20,
        25:20, 26:20, 27:21, 28:21, 29:21,
        30:22, 31:22, 32:22, 33:23, 34:23,
        35:23, 36:23, 37:24, 38:24, 29:24,
        40:24, 41:25, 42:25, 43:25, 44:25,
        45:25, 46:26, 47:25, 48:25, 49:24,
        50:24, 51:24, 52:24, 53:23, 54:23,
        55:23, 56:23, 57:22, 58:22, 59:22,
        60:22, 61:21, 62:21, 63:21, 64:21,
        65:20, 66:20, 67:20, 68:19, 69:19,
        70:19, 71:18, 72:18, 73:18, 74:17,
        75:17, 76:17, 77:16, 78:16, 79:16,
        80:15, 81:15, 82:15, 83:14, 84:14,
        85:14, 86:13, 87:13, 88:13, 89:12,
        90:12, 91:12, 92:11, 93:11, 94:11,
        95:10, 96:10, 97:10, 98: 9, 99:9,
        100:9
    };

    Game.new_game = function(settings) {
        Util.assert(
            2 <= settings.players.length && settings.players.length <= 6, 
            "Games should have between 2 and 6 players.");

        var game_state = Factory.GameState();

        // Initialize the players.
        for (var i = 0; i < settings.players.length; i++) {
            Util.assert(settings.players[i] > 0, "Invalid player id.");
            var p = new Factory.Player();
            p.id = settings.players[i];
            game_state.players.push(p);
        }

        // Randomize the player order.
        Util.Array.shuffle(game_state.players);

        // Initialize the map from the template.
        Map.check_city_ids(settings.map);
        Map.check_city_locations(settings.map);
        game_state.map = settings.map;
        Map.seed_cubes(game_state.map);

        return game_state;
    };


    Game.next_bidder = function(game_state) {
        Util.assert(Game.is_bidding_round(game_state), "Not a bidding round.");

        var highest_bidder = Game.get_top_bidder(game_state);

        while (true) {
            game_state.current_seat = Game.get_next_seat(game_state);
            var current_player = Game.get_current_player(game_state);
            
            if (current_player == highest_bidder) {
                // Bidding is over.
                Game.end_bidding(game_state);
                return;
            }
            else if (!Player.has_passed_bidding(current_player)) {
                // It is this player's turn.
                return;
            }
            else {
                // Skip this player because he/she has already passed.
                continue;
            }
        }
    };

    Game.end_bidding = function(game_state) {
        Util.assert(Game.is_bidding_round(game_state), "Not in bidding round.");

        // Advance the round.
        game_state.round = 1;

        var top_bidder = Game.get_top_bidder(game_state);
        var top_seat   = Game.get_seat_for_player_id(game_state, top_bidder.id);

        // If nobody placed a bid, the first player is just advanced by one.
        if (Player.has_passed_bidding(top_bidder)) {
            top_seat = Game.get_next_seat_for_seat(game_state, game_state.first_seat);
        }

        // Otherwise, the top bidder has to pay.
        else {
            Game.pay(game_state, top_bidder.id, Player.get_bid(top_bidder));
        }

        game_state.first_seat = top_seat;
        game_state.current_seat = top_seat;

        // Clear bids.
        for (var i = 0; i < game_state.players.length; i++) {
            Util.assert(Player.get_bid(game_state.players[i]) != 0, "This player never made a bid or passed.");
            Player.clear_bid(game_state.players[i]);
        }
    };

    Game.end_player_turn = function(game_state, player_id) {
        Game.ensure_player_turn(game_state, player_id);

        var player = Game.get_player_by_id(game_state, player_id);
        if (Player.get_executive(player)) {
            Player.set_executive(player, false);
            return;
        }

        game_state.current_seat = Game.get_next_seat(game_state);

        if (Game.get_current_seat(game_state) == Game.get_first_seat(game_state)) {
            game_state.round += 1;
        }

        if (game_state.round > 3) {
            Game.end_game_turn(game_state);
        }
    };

    Game.end_game_turn = function(game_state) {
        Util.assert(game_state.round > 3, "Not the end of the round.");
        Util.assert(Game.get_current_seat(game_state) == Game.get_first_seat(game_state), "Have not returned to the first player.");

        game_state.turn += 1;
        game_state.round = Game.BiddingRound;
        game_state.current_seat = game.first_seat;

        // Look for incomplete tracks and remove them.
        var tracks = Game.get_track_array(game_state);
        for (var i = 0; i < tracks.length; i++) {
            if (!tracks[i].complete) {
                tracks.splice(i, 1);
                i -= 1;
            }
        }

        // Income
        var seats = Game.get_seats(game_state);
        for (var i = 0; i < seats.length; i++) {
            var player = seats[i];
            var earnings = Game.score_to_income[player.points] - player.shares;
            Game.pay(game_state, player.id, -earnings); // Pay negative amount (usually)
        }

        Game.add_card(game_state);
    };

    Game.add_card = function(game_state) {
        var remaining_cards = Game.get_remaining_cards(game_state);
        if (remaining_cards.length == 0) {
            return;
        }
        
        Util.Array.shuffle(remaining_cards);
        var card_id = remaining_cards[0];
        game_state.active_cards.push(card);
        game_state.cards_dealt.push(card);

        // Note: If multiple players have completed the major line, all will be awarded
        //  the prize.
        var card = Game.get_card_by_id(game_state, card_id);
        if (card.minor_type == Cards.MinorTypes.MAJOR_LINE) {
            Game.get_seats(game_state).forEach(function(player) {
                if (Game.test_major_line_card_for_player(game_state, player.id, card)) {
                    Game.claim_achievement_card(game_state, player.id, card.id);
                }
            });
        }
        
    };

    Game.pay = function(game_state, player_id, amount) {
        var player = Game.get_player_by_id(game_state, player_id);
        while (Player.get_money(player) < amount) {
            Player.add_share(player);
            Player.adjust_money(player, 5);
        }
        Player.adjust_money(player, -amount);
    };

    Game.get_first_player = function(game_state) {
        return game_state.players[game_state.first_seat];
    };

    Game.get_first_seat = function(game_state) {
        return game_state.first_seat;
    };
    
    Game.get_current_player = function(game_state) {
        return game_state.players[game_state.current_seat];
    };

    Game.get_next_player = function(game_state) {
        return game_state.players[Game.get_next_seat(game_state)];
    };

    Game.get_num_seats = function(game_state) {
        return game_state.players.length;
    };

    Game.get_current_seat = function(game_state) {
        return game_state.current_seat;
    };

    Game.get_last_seat = function(game_state) {
        return game_state.first_seat == 0 ? game_state.players.length - 1 : game_state.first_seat - 1;
    };

    Game.get_last_player = function(game_state) {
        return game_state.players[Game.get_last_seat(game_state)];
    };

    Game.get_next_seat = function(game_state) {
        return Game.get_next_seat_for_seat(game_state, game_state.current_seat);
    };

    Game.get_next_seat_for_seat = function(game_state, seat) {
        return seat + 1 == game_state.players.length ? 0 : seat + 1;
    };

    Game.get_player_by_seat = function(game_state, seat_number) {
        return game_state.players[seat_number];
    };

    Game.get_player_by_id = function(game_state, player_id) {
        for (var i = 0; i < game_state.players.length; i++) {
            if (game_state.players[i].id == player_id) {
                return game_state.players[i];
            }
        }
    };

    Game.get_remaining_cards = function(game_state) {
        var remaining_cards = [];
        game_state.deck.forEach(function(card) {
            if (!Util.Array.contains(game_state.cards_dealt, card.id)) {
                remaining_cards.push(card.id);
            }
        });
        return remaining_cards;
    };

    Game.get_card_by_id = function(game_state, card_id) {
        for (var i = 0; i < game_state.deck.length; i++) {
            if (game_state.deck[i].id == card_id) {
                return game_state.deck[i];
            }
        }
        Util.assert(false, "Unable to find card with id = " + card_id.toString());
    };

    /**
     Return an array of card ids that are available for players to take/achieve.
     */
    Game.get_active_cards = function(game_state) {
        return game_state.active_cards;
    };

    /**
     Returns an array containing the actual cards the specified player has (not just the
     card ids).
     */
    Game.get_cards_for_player = function(game_state, player_id) {
        var player = Game.get_player_by_id(game_state, player_id);
        var card_ids = Player.get_cards(player);
        return card_ids.map(function(card_id) {
            return Game.get_card_by_id(game_state, card_id);
        });
    };

    /**
     Return an array of player objects in seating order. Note that the first element is not
     necessarily the first player of the current turn.
     */
    Game.get_seats = function(game_state) {
        return game_state.players;
    };

    /**
     Return the seat index for the given player_id.
     */
    Game.get_seat_for_player_id = function(game_state, player_id) {
        for (var i = 0; i < game_state.players.length; i++) {
            if (game_state.players[i].id == player_id) {
                return i;
            }
        }
        Util.assert(false, "Invalid player_id received.");
    };

    Game.get_active_cards = function(game_state) {
        return game_state.active_cards.map(function(card_id) {
            return Game.get_card_by_id(game_state, card_id);
        });
    };

    Game.remove_active_card_id = function(game_state, card_id) {
        Util.Array.remove(game_state.active_cards, card_id);
    };

    Game.claim_achievement_card = function(game_state, player_id, card_id) {
        var player = Game.get_player_by_id(game_state, player_id);
        var card = Game.get_card_by_id(game_state, card_id);

        Util.assert(card.major_type == Cards.MajorTypes.ACHIEVEMENT, "Card is not an achievement.");

        Player.add_points(player, card.points);
        Game.remove_active_card_id(game_state, card_id);
    };

    Game.get_top_bid = function(game_state) {
        return Game.get_top_bidder(game_state).bid;
    };

    Game.get_top_bidder = function(game_state) {
        var top_bid = 0;
        var top_player = Game.get_first_player(game_state);
        Game.get_seats(game_state).forEach(function(player) {
            if (player.bid > top_bid) {
                top_bid = player.bid;
                top_player = player;
            }
        });
        return top_player;
    };

    Game.is_bidding_round = function(game_state) {
        return game_state.round == Game.BiddingRound;
    };

    Game.get_round = function(game_state) {
        return game_state.round;
    };

    Game.num_players = function(game_state) {
        return game_state.players.length;
    };

    Game.get_track_array = function(game_state) {
        return game_state.tracks;
    };

    Game.get_track_by_id = function(game_state, track_id) {
        for (var i = 0; i < game_state.tracks.length; i++) {
            if (game_state.tracks[i].id == track_id) {
                return game_state.tracks[i];
            }
        }
        Util.assert(false, "Specified id does not match any tracks.");
    };

    Game.get_tracks_by_hex = function(game_state, hex) {
        var tracks = [];
        for (var i = 0; i < game_state.tracks.length; i++) {
            var track = game_state.tracks[i];
            var path = track.path;
            for (var j = 0; j < path.length; j++) {
                if (Map.Hex.is_equal(path[j], hex)) {
                    tracks.push(track);
                }
            }
        }
        return tracks;
    };


    /**
     If the two tracks can join together, create a new track object that is the combination
     of the path of the two tracks. For tracks to join, they must have the same owner. Does
     not alter the game_state in any way.

     @return
     
     */
    Game.combine_tracks_if_possible = function(game_state, track1, track2) {
        function can_paths_combine_head_to_head(path1, path2) {
            return Map.Hex.is_equal(path1[0], path2[1]) && Map.Hex.is_equal(path1[1], path2[0]);
        };

        if (track1.complete || track2.complete) { return null; }
        if (track1.owner != track2.owner)       { return null; }

        // Make copies so we can modify them without corrupting the game state.
        var first = track1.path.slice();
        var second = track2.path.slice();

        for (var i = 0; i < 4; i++) {
            switch (i) {
                case 0:                   break;  // f f
                case 1: second.reverse(); break;  // f r
                case 2: first.reverse();  break;  // r r
                case 3: second.reverse(); break;  // r f
            };

            if (can_paths_combine_head_to_head(first, second)) {

                // Trim the overlapping end-points, and reverse the first path so that it
                // will join correctly with the second.
                first.splice(0, 1);
                second.splice(0, 1);
                first.reverse();
                var new_path = first.concat(second);

                var new_track = Factory.Track();
                new_track.owner = track1.owner;
                new_track.path  = new_path;
                
                // If the new track has a city at both ends, it is complete.
                var map = game_state.map;
                if (Map.is_city(map, new_path[0]) && Map.is_city(map, new_path[new_path.length -1])) {
                    new_track.complete = true;
                }
                return new_track;
            }
        }

        return null;
    };

    Game.get_new_track_id = function(game_state) {
        var tracks = Game.get_track_array(game_state);
        return tracks.length == 0 ? 1 : tracks[tracks.length - 1].id + 1;
    };

    Game.cost_for_engine = function(game_state, player_id) {
        var player = Game.get_player_by_id(game_state, player_id);
        var engine = Player.get_engine(player);
        Util.assert(engine < 8, "Player already has max engine level.");
        var costs = {  // Cost to upgrade FROM the specified level.
            1 : 5000,
            2 : 10000,
            3 : 10000,
            4 : 15000,
            5 : 15000,
            6 : 20000,
            7 : 20000,
        };
        return costs[engine];
    };

    /**
     * @param player_id Players may have special effects that alter the cost of track.
     */
    Game.cost_for_track = function(game_state, player_id, path) {
        var map = game_state.map;
        var land_grant = Player.get_land_grant(Game.get_player_by_id(game_state, player_id));
        
        var cost = 0;
        for (var i = 1; i < path.length - 1; i++) {
            // Terrain cost
            var terrain  = Map.get_terrain(map, path[i]);
            var hex_cost;
            if (terrain == Map.Terrain.PLAINS && land_grant) {
                hex_cost = 0;
            }
            else {
                hex_cost = Map.Terrain.properties[terrain].cost;
                Util.assert(hex_cost > 0, "Invalid hex cost.");
            }
            cost += hex_cost;

            // Existing track test.
            // This doesn't say anything about whether it is legal to cross this many track.
            // All is does is say crossing any number of existing tracks adds a cost.
            var tracks = Game.get_tracks_by_hex(game_state, path[i]);
            if (tracks.length > 0) {
                cost += Map.Terrain.CROSSING_COST;
            }
        }

        // Ridge test.
        for (var i = 1; i < path.length; i++) {
            if (Map.crosses_ridge(map, path[i - 1], path[i])) {
                if (i == 1 || i == path.length - 1) {
                    cost += Map.Terrain.HALF_RIDGE_COST;
                }
                else {
                    cost += Map.Terrain.RIDGE_COST;
                }
            }
        }

        return cost;
    };

    /**
     @return
     The newly added track. If the track was combined with another one, the combined track
     is returned.
     */
    Game.add_track = function(game_state, owner_id, path) {
        Util.assert(Map.is_valid_path(game_state.map, path), "Invalid track path.");
        

        var map = game_state.map;
        var tracks = Game.get_track_array(game_state);

        var new_track = Factory.Track();

        new_track.owner    = owner_id;
        new_track.path     = path;
        new_track.complete = false;

        // Step 1: Try to combine this path with an existing track.
        //  This can have the side-effect of making a copy of the tracks array so we can
        //  modify it without breaking the gamestate and then exiting this function due to
        //  the action failing. This function always exits with the game_state either
        //  unchanged, or correctly updated, regardless of exceptions thrown.
        for (var i = 0; i < tracks.length; i++) {
            var tmp_track = Game.combine_tracks_if_possible(game_state, new_track, tracks[i]);
            if (tmp_track !== null) {
                new_track = tmp_track;
                tracks = tracks.slice();
                Util.Array.remove(tracks, tracks[i]);
                break;
            }
        }

        // First, make sure the track doesn't cross any hex that has two track in it.
        function do_paths_overlap(path1, path2) {
            // The test will be:
            // If a hex from path1 is the same as a hex from path2, test if the next hex
            // of path1 is the same as the previous or next hex of path2. If yes, then the
            // paths overlap. We don't test the last hex of path1 because even if it is the
            // same, there is no next hex to compare with (and so there can't be an overlap).
            for (var i = 0; i < path1.length - 1; i++) {
                var hex1 = path1[i];
                for (var j = 0; j < path2.length; j++) {
                    var hex2 = path2[j];
                    if (Map.Hex.is_equal(hex1, hex2)) {
                        var next1 = path1[i + 1];
                        if (j < path2.length - 1 && Map.Hex.is_equal(next1, path2[j + 1])) {
                            return true;
                        }
                        if (j > 0 && Map.Hex.is_equal(next1, path2[j - 1])) {
                            return true;
                        }
                    }
                }
            }
        };

        function endpoints_match(l, r) {
            return Map.Hex.is_equal(l[0], r[0]) && Map.Hex.is_equal(Util.Array.back(l), Util.Array.back(r));
        };

        // Test if this track overlaps an existing track.
        // Two tracks overlap (as opposed to cross) if they both move from some hex to an
        // adjacent hex.
        for (var i = 0; i < tracks.length; i++) {
            Util.assert(!do_paths_overlap(tracks[i].path, new_track.path), "Tracks overlap.");
        }

        for (var i = 1; i < new_track.path.length; i++) {
            var tracks_on_hex = Game.get_tracks_by_hex(game_state, new_track.path[i]);
            Util.assert(tracks_on_hex.length < 2, "There are too many tracks on hex.");
        }

        // Test if this player already has a route connecting the two endpoints of this
        // new track. If yes, then this is an illegal new path.
        for (var i = 0; i < tracks.length; i++) {
            var other = tracks[i];
            if (other.owner == new_track.owner &&
                (endpoints_match(new_track.path, other.path) ||
                 endpoints_match(new_track.path, other.path.slice().reverse()))) {
                Util.assert(false, "Player has an existing route matching this one.");
            }
        }

        new_track.id = Game.get_new_track_id(game_state);
        var front = new_track.path[0];
        var back  = new_track.path[new_track.path.length - 1];
        Util.assert(Map.is_city(map, front) || Map.is_city(map, back), "The new track doesn't connect with any cities.");

        if (Map.is_city(map, front) && Map.is_city(map, back)) {
            new_track.complete = true;
        }

        tracks.push(new_track);
        game_state.tracks = tracks; // It may have been copied if tracks were combined.
        return new_track;
    };

    /**
     Test if the specified player has completed a major line. To test for all players, call
     iteratively for each player.

     @return
     A list of card objects of completed major lines.
     */
    Game.check_for_major_lines = function(game_state, player_id) {
        var completed = [];
        game_state.active_cards.forEach(function(card_id) {
            var card = Game.get_card_by_id(game_state, card_id);
            if (card.minor_type == Cards.MinorTypes.MAJOR_LINE) {
                var connected = Game.test_major_line_card_for_player(
                    game_state, player_id, card
                );

                if (connected) {
                    completed.push(card);
                }
            }
        });
        return completed;
    };

    Game.test_major_line_card_for_player = function(game_state, player_id, card) {
        return Game.test_if_cities_connected_by_player(
            game_state,
            player_id,
            card.city1_id,
            card.city2_id,
            card.with_link
        );
    };

    Game.test_if_cities_connected_by_player = function(game_state, player_id, city1_id, city2_id, with_link) {
        var cities = [Map.get_city_by_id(game_state.map, city1_id)];
        var city_index = 0;

        var connected = false;
        var has_western_link = !with_link; // If not needed, set to true.
        while (city_index < cities.length) {
            var city = cities[city_index];
            var city_hex = City.get_hex(city);


            if (city.western_link == City.WesternLinkState.BUILT) {
                has_western_link = true;
            }

            if (city.id == city2_id) {
                connected = true;
                break;
            }

            Game.get_tracks_by_hex(game_state, City.get_hex(city)).forEach(function(track) {
                if (track.owner == player_id) {
                    var next_city = Map.get_city_at_other_end_of_track(game_state.map, track, city.id);
                    if (Util.Array.contains(cities, next_city) == false) {
                        cities.push(next_city);
                    }
                }
            });

            city_index += 1;
        }

        return connected && has_western_link;
    };

    Game.ensure_not_land_grant = function(game_state, player_id) {
        return !Player.get_land_grant(Game.get_player_by_id(game_state, player_id))
    };

    /**
     This is not intended for bidding actions. See ensure_player_bid for that.
     */
    Game.ensure_player_turn = function(game_state, player_id) {
        var current_player = Game.get_current_player(game_state);
        Util.assert(current_player.id == player_id, "It is not this player's turn.");
        Util.assert(!Game.is_bidding_round(game_state), "It is currently a bidding round.");
    };

    Game.ensure_player_bid = function(game_state, player_id) {
        var current_player = Game.get_current_player(game_state);
        Util.assert(current_player.id == player_id, "It is not this player's turn.");
        Util.assert(Game.is_bidding_round(game_state), "It is not a bidding round.");
    };

    Game.max_hexes_for_player = function(game_state, player_id) {
        var player_cards = Game.get_cards_for_player(game_state, player_id);
        var max_hexes = 4;
        player_cards.forEach(function(card) {
            if (card.minor_type == Cards.MinorTypes.PERFECT_ENG) {
                max_hexes = 5;
            };
        });
        return max_hexes;
    };

}());

(function() {
    // Public API
    Action.bid_for_first_seat = function(game_state, player_id, amount) {
        Game.ensure_player_bid(game_state, player_id);
        
        var top_bid = Game.get_top_bid(game_state);
        Util.assert(top_bid < amount, "Bid is not higher than previous build.");

        var player = Game.get_player_by_id(game_state, player_id);
        Player.set_bid(player, amount);

        Game.next_bidder(game_state);
    };

    // Public API
    Action.pass_bidding = function(game_state, player_id) {
        Game.ensure_player_bid(game_state, player_id);

        var player = Game.get_player_by_id(game_state, player_id);
        Util.assert(Game.get_current_player(game_state).id == player_id, "Not the current player.");
        Player.set_passed_bidding(player);
        Game.next_bidder(game_state);
    };

    // Public API
    Action.pass_turn = function(game_state, player_id) {
        Game.ensure_player_turn(game_state, player_id);
        Game.end_player_turn(game_state, player_id);
    };

    // Public API
    Action.build_track = function(game_state, player_id, path) {
        Game.ensure_player_turn(game_state, player_id);
        Util.assert(path.length >= 3, "No tracks specified.");

        var max_hexes = Game.max_hexes_for_player(game_state, player_id);
        Util.assert(path.length <= max_hexes + 2, "Only 4 hexes of track can be built at a time.");

        // Do this before the new track is added to the game so we don't think we're crossing
        // our own track.
        var cost = Game.cost_for_track(game_state, player_id, path);

        // Most of the error checking for valid tracks is done in this function.
        var new_track = Game.add_track(game_state, player_id, path);

        Game.pay(game_state, player_id, cost);

        // Test if a major line was completed.
        Game.check_for_major_lines(game_state, player_id).forEach(function(card) {
            Game.claim_achievement_card(game_state, player_id, card.id);
        });
        
        Player.set_land_grant(Game.get_player_by_id(game_state, player_id), false);
        Game.end_player_turn(game_state, player_id);
    };

    /**
     Public API

     @param color
     The color can optionally be undefined. If it is undefined or Color.colors.INVALID, it
     will automatically resolve to the color of the destination city. There is currently a
     single case where specifying the color is required. On a city with the western link
     built, it is possible to have both regular red cubes as well as western link red cubes
     */
    Action.deliver_goods = function(game_state, player_id, source_id, segment_ids, color) {
        Game.ensure_player_turn(game_state, player_id);
        Game.ensure_not_land_grant(game_state, player_id);
        var player = Game.get_player_by_id(game_state, player_id);

        Util.assert(
            Game.get_track_by_id(game_state, segment_ids[0]).owner == player_id,
            "Player doesn't own first segment.");
        Util.assert(
            Player.get_engine(player) >= segment_ids.length,
            "Player needs a stronger engine.");

        var source_city = Map.get_city_by_id(game_state.map, source_id);
        var dest_city = source_city;
        var dest_hex = City.get_hex(dest_city);

        // This will keep track of how many segments of each player were used in the path.
        var points = {};
        Game.get_seats(game_state).forEach(function(player) {
            points[player.id] = 0;
        });

        // This will make sure there are no loops in the path.
        var cities = {};
        cities[source_id] = true;

        // This will make sure there are no colors matching the dest city on the path.
        var colors = {};

        // Find the destination city.
        for (var i = 0; i < segment_ids.length; i++) {
            var track = Game.get_track_by_id(game_state, segment_ids[i]);
            if (Map.Hex.is_equal(dest_hex, track.path[0])) {
                dest_hex = Util.Array.back(track.path);
            }
            else if (Map.Hex.is_equal(dest_hex, Util.Array.back(track.path))) {
                dest_hex = track.path[0];
            }
            else {
                Util.assert(false, "Segment doesn't create contiguous path.");
            }
            dest_city = Map.get_city_by_hex(game_state.map, dest_hex);
            Util.assert(!cities.hasOwnProperty(dest_city.id), "Path contains loop.");
            cities[dest_city.id] = true;
            if (i < segment_ids.length - 1) {  // Don't add the dest city.
                colors[dest_city.color] = true;
            }
            points[track.owner] += 1;
        }

        Util.assert(!colors.hasOwnProperty(dest_city.color), "Path contains destination color.");

        // Ensure the source city has a cube of the correct color, and remove it.
        Util.assert(source_city.cubes[dest_city.color] > 0, "No cubes of the correct color.");
        source_city.cubes[dest_city.color] -= 1;

        if (dest_city.western_link == City.WesternLinkState.DEST
            && source_city.western_link == City.WesternLinkState.BUILT) {
            for (var j = 0; j < 2; j++) {
                var color = Util.Array.select(Color.cubes);
                dest_city.cubes[color] += 1;
            }
        }

        // Give the player points.
        Game.get_seats(game_state).forEach(function(player) {
            Player.add_points(player, points[player.id]);
        });

        // Award points for hotels.
        Game.get_seats(game_state).forEach(function(player) {
            var player_cards = Game.get_cards_for_player(game_state, player.id);
            player_cards.forEach(function(card) {
                if (card.minor_type == Cards.MinorTypes.HOTEL && card.city_id == dest_city.id) {
                    Player.add_points(player, 1);
                };
            });
        });

        // Claim achievement cards.
        // TODO: Will this break if there are more cards after the one we remove from the
        //   deck? What if more than one achievement is claimed at a time?
        Game.get_active_cards(game_state).forEach(function(card) {
            // railroad era begins
            // If the card is present in the card row, it clearly hasn't been claimed yet,
            // so there is no special checking for if this was the first goods cube delivered.
            if (card.minor_type == Cards.MinorTypes.RAILROAD_ERA) {
                Game.claim_achievement_card(game_state, player_id, card.id);
            }

            else if (card.minor_type == Cards.MinorTypes.SPEED_RECORD && segment_ids.length >= 3) {
                Game.claim_achievement_card(game_state, player_id, card.id);
            }

            // service bounty
            else if (card.minor_type == Cards.MinorTypes.SERVICE_BOUNTY && card.city_id == dest_city.id) {
                Game.claim_achievement_card(game_state, player_id, card.id);
            }
        });

        Game.end_player_turn(game_state);
    };

    Action.upgrade_engine = function(game_state, player_id) {
        Game.ensure_player_turn(game_state, player_id);
        Game.ensure_not_land_grant(game_state, player_id);

        Player.increment_engine(Game.get_player_by_id(game_state, player_id));
        Game.pay(game_state, player_id, Game.cost_for_engine(game_state, player_id));

        // Test if the new train achievement was completed.
        var player = Game.get_player_by_id(game_state, player_id);
        if (Player.get_engine(player) == 4) {
            game_state.active_cards.forEach(function(card_id) {
                var card = Game.get_card_by_id(game_state, card_id);
                if (card.minor_type == Cards.MinorTypes.NEW_TRAIN) {
                    Game.claim_achievement_card(game_state, player_id, card.id);
                }
            });
        }

        Game.end_player_turn(game_state);
    };

    Action.urbanize = function(game_state, player_id, city_id, color) {
        Game.ensure_player_turn(game_state, player_id);
        Game.ensure_not_land_grant(game_state, player_id);

        Util.assert(Util.Array.contains(Color.urbanize_colors, color), "Invalid color");

        var city = Map.get_city_by_id(game_state.map, city_id);
        Util.assert(city.color == Color.colors.GRAY, "Invalid city color");

        city.color = color;

        for (var j = 0; j < 2; j++) {
            var color = Util.Array.select(Color.cubes);
            city.cubes[color] += 1;
        }

        Game.pay(game_state, player_id, 10);
        Game.end_player_turn(game_state);
    };

    Action.western_link = function(game_state, player_id, city_id) {
        Game.ensure_player_turn(game_state, player_id);
        Game.ensure_not_land_grant(game_state, player_id);

        var city = Map.get_city_by_id(game_state.map, city_id);
        Util.assert(city.western_link != City.WesternLinkState.BUILT, "Western link is already built.");
        Util.assert(city.western_link != City.WesternLinkState.NONE, "City cannot have a western link.");

        city.western_link = City.WesternLinkState.BUILT;
        city.cubes[Color.colors.RED] = 4;

        Game.pay(game_state, player_id, 30);

        // Test if a major line was completed.
        Game.check_for_major_lines(game_state, player_id).forEach(function(card) {
            Game.claim_achievement_card(game_state, player_id, card.id);
        });

        Game.end_player_turn(game_state);
    };
    
    Action.play_action_card = function(game_state, player_id, card_id) {
        Game.ensure_player_turn(game_state, player_id);
        Game.ensure_not_land_grant(game_state, player_id);
        
        var player = Game.get_player_by_id(game_state, player_id);
        var cards = Player.get_cards(player);

        Util.assert(Util.Array.contains(cards, card_id), "Doesn't have that card.");

        // Note: playing an action card does not implicitly end the turn.
        
        var card = Game.get_card_by_id(game_state, card_id);
        if (card.minor_type == Cards.MinorTypes.LAND_GRANT) {
            Player.set_land_grant(player, true);
        }
    };

    Action.take_action_card = function(game_state, player_id, card_id, options) {
        Util.default_arg(options, {});
        
        Game.ensure_player_turn(game_state, player_id);
        Game.ensure_not_land_grant(game_state, player_id);

        Util.assert(Util.Array.contains(Game.get_active_cards(game_state), card_id), "That card is not active.");

        var player = Game.get_player_by_id(game_state, player_id);
        var card = Game.get_card_by_id(game_state, card_id);
        
        Util.assert(card.major_type != Cards.MajorTypes.ACHIEVEMENT, "Can't take achievements.");
        
        if (card.minor_type == Cards.MinorTypes.EXECUTIVE) {
            Player.set_executive(player, true);
            return;
        }

        Game.end_player_turn(game_state);
    };
}());
