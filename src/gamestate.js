
var Action  = {};
var City    = {};
var Color   = {};
var Factory = {};
var Game    = {};
var Map     = {};
var Player  = {};
var Util    = {};

(function() {
    exports.Action  = Action;
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

    Util.log = function(game_state, log_entry) {
        game_state.log.push(log_entry);
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

    Util.Array.remove = function(array, element) {
        var index = array.indexOf(element);
        if (index == -1) {
            return array;
        }
        else {
            return array.splice(index, 1);  // In place, but return the value for chaining.
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
       0,0  0,1  0,2
         1,0  1,1  1,2
       2,0  2,1  2,2
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

    Factory.GameState = function() {
        return {
            players       : [],  // An array of player objects.
            tracks        : [],  // An array of track objects.
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
        WEST   : 7,  // For western link cubes
        properties : {
            0: { name: "invalid" },
            1: { name: "red"     },
            2: { name: "yellow"  },
            3: { name: "blue"    },
            4: { name: "purple"  },
            5: { name: "black"   },
            6: { name: "gray"    },
            7: { name: "west"    },
        },
    };

    // The colors that can be seeded onto cities as random cubes.
    // This doesn't include the WEST color, although that is a cube type, because it cannot
    // be placed as a random cube.
    Color.random_cubes = [
        Color.colors.RED,
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
        Color.colors.WEST,
    ];

}());

(function() {
    City.WesternLinkState = {
        NONE    : 0,
        POSSIBLE: 1,
        BUILT   : 2,
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
                var color = Util.Array.select(Color.random_cubes);
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

}());

(function() {
    Game.BiddingRound = 0;
    Game.NumRounds    = 3; // Actual number of play rounds (doesn't include bidding).

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

    Game.end_turn = function(game_state, player_id) {
        Util.not_ready();
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
            for (var j = 1; j < path.length - 1; j++) { // Don't check endpoints.
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

    Game.cost_for_track = function(game_state, path) {
        var map = game_state.map;
        
        var cost = 0;
        for (var i = 1; i < path.length - 1; i++) {
            // Terrain cost
            var terrain  = Map.get_terrain(map, path[i]);
            var hex_cost = Map.Terrain.properties[terrain].cost;
            Util.assert(hex_cost > 0, "Invalid hex cost.");
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

        // Most tracks connect city to city in one action. We do a short-cut test for that
        // before trying to extend an existing, incomplete track, or adding this as an
        // incomplete track.

        var new_track = Factory.Track();
        new_track.owner    = owner_id;
        new_track.path     = path;
        new_track.complete = false;

        function endpoints_match(l, r) {
            return Map.Hex.is_equal(l[0], r[0]) && Map.Hex.is_equal(Util.Array.back(l), Util.Array.back(r));
        };

        function ensure_track_isnt_duplicate(tracks, track) {
            for (var i = 0; i < tracks.length; i++) {
                var other = tracks[i];
                if (other.owner == track.owner &&
                    (endpoints_match(track.path, other.path) ||
                     endpoints_match(track.path, other.path.slice().reverse()))) {
                    Util.assert(false, "Player has an existing route matching this one.");
                }
            }
        };

        if (Map.is_city(map, path[0]) && Map.is_city(map, path[path.length-1])) {
            new_track.id = Game.get_new_track_id(game_state);
            ensure_track_isnt_duplicate(Game.get_track_array(game_state), new_track);
            game_state.tracks.push(new_track);
            return new_track;
        }

        var tracks = Game.get_track_array(game_state);
        for (var i = 0; i < tracks.length; i++) {
            var combo_track = Game.combine_tracks_if_possible(game_state, new_track, tracks[i]);
            if (combo_track !== null) {

                // Create a local copy of the tracks array so that errors won't corrupt
                // the game state.
                var tracks = Game.get_track_array(game_state).slice();
                Util.Array.remove(tracks, tracks[i]);

                combo_track.id = Game.get_new_track_id(game_state);
                ensure_track_isnt_duplicate(tracks, combo_track);
                tracks.push(combo_track);

                // Swap the old array with the new one.
                game_state.tracks = tracks;
                return combo_track;
            }
        }

        // If we fall through the previous loop, this new track is guaranteed to have the
        // following two properties:
        // - At least one end is not a city.
        // - It cannot combine with any other tracks.
        //
        // Given that, we must assume this track is meant to stand alone. In that case,
        // the last check to do is that it has at least one end-point on a city.
        if (Map.is_city(map, path[0]) || Map.is_city(map, path[path.length -1])) {
            new_track.id = Game.get_new_track_id(game_state);
            ensure_track_isnt_duplicate(Game.get_track_array(game_state), new_track);
            game_state.tracks.push(new_track);
            return new_track;
        }

        Util.assert(false, "The new track didn't connect with any cities.");
    };

    Game.ensure_player_turn = function(game_state, player_id) {
        var current_player = Game.get_current_player(game_state);
        Util.assert(current_player.id == player_id, "It is not this player's turn.");
    };

}());

(function() {
    // Public API
    Action.bid_for_first_seat = function(game_state, player_id, amount) {
        Util.assert(Game.is_bidding_round(game_state), "Not a bidding round.");
        Util.assert(Game.get_current_player(game_state).id == player_id, "Not the current player.");
        
        var top_bid = Game.get_top_bid(game_state);
        Util.assert(top_bid < amount, "Bid is not higher than previous build.");

        var player = Game.get_player_by_id(game_state, player_id);
        Player.set_bid(player, amount);

        Game.next_bidder(game_state);
    };

    // Public API
    Action.pass_bidding = function(game_state, player_id) {
        Util.assert(Game.is_bidding_round(game_state), "Not a bidding round.");

        var player = Game.get_player_by_id(game_state, player_id);
        Util.assert(Game.get_current_player(game_state).id == player_id, "Not the current player.");
        Player.set_passed_bidding(player);
        Game.next_bidder(game_state);
    };

    // Public API
    Action.pass_turn = function(game_state, player_id) {
        Game.ensure_player_turn(game_state, player_id);
        Game.end_turn(game_state, player_id);
    };

    // Public API
    Action.build_track = function(game_state, player_id, path) {
        Game.ensure_player_turn(game_state, player_id);
        Util.assert(path.length >= 3, "No tracks specified.");
        Util.assert(path.length <= 6, "Only 4 hexes of track can be built at a time.");

        // Most of the error checking for valid tracks is done in this function.
        var new_track = Game.add_track(game_state, player_id, path);
        var cost = Game.cost_for_track(game_state, path);
        
        Game.pay(game_state, player_id, cost);
        Game.end_turn(game_state, player_id);
    };

}());
