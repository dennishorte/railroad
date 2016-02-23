
var Util = {};
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

    Util.shuffle = function (array) {
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

    exports.Util = Util;
}());

var Factory = {};
(function() {
    Factory.Settings = function() {
        return {
            players: [],
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

    Factory.GameState = function() {
        return {
            players: [],         // An array of player objects.
            first_seat    :  0,  // changes each turn
            current_seat  :  0,
            round         :  0,  // 3 rounds per turn + round 0 = bidding for first player
            turn          :  1,  // no turn limit, but nice for logging
        };
    }

    exports.Factory = Factory;
}());

var Player = {};
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

    exports.Player = Player;
}());

var Game = {};
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
        Util.shuffle(game_state.players);

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

    exports.Game = Game;
}());

var Action = {};
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

    exports.Action = Action;
}());
