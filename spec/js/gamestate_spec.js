var rail_root = require("../../src/gamestate");
var rail = rail_root.Game;
var railp = rail_root.Player;
var rail_factory = rail_root.Factory;

describe("new_game", function() {
    var settings;

    beforeEach(function() {
        settings = rail_factory.Settings();
        settings.players = [7, 2, 3];
    });

    it("requires a settings object", function() {
        expect(function() { rail.new_game(); }).toThrow();
    });

    it("requires 2 to 6 players", function() {
        settings.players = [1];
        expect(function() { rail.new_game(settings); }).toThrow();
        settings.players.push(2);
        expect(function() { rail.new_game(settings); }).not.toThrow();
        settings.players.push(3);
        expect(function() { rail.new_game(settings); }).not.toThrow();
        settings.players.push(4);
        expect(function() { rail.new_game(settings); }).not.toThrow();
        settings.players.push(5);
        expect(function() { rail.new_game(settings); }).not.toThrow();
        settings.players.push(6);
        expect(function() { rail.new_game(settings); }).not.toThrow();
        settings.players.push(7);
        expect(function() { rail.new_game(settings); }).toThrow();
    });

    describe("initializes a player object for each player", function() {
        var game;

        beforeEach(function() {
            game = rail.new_game(settings);
        });

        it("with the correct ids", function() {
            expect(rail.num_players(game)).toEqual(3);
            expect(rail.get_player_by_id(game, 7)).toBeDefined();
            expect(rail.get_player_by_id(game, 2)).toBeDefined();
            expect(rail.get_player_by_id(game, 3)).toBeDefined();
        });

        it("with correct initial values", function() {
            for (var i = 0; i < settings.players.length; i++) {
                var player = rail.get_player_by_id(game, settings.players[i]);
                expect(player.shares).toEqual(0);
                expect(player.money).toEqual(0);
                expect(player.points).toEqual(0);
                expect(player.engine).toEqual(1);
                expect(player.cards.length).toEqual(0);
            }
        });
    });

    it("returns a game state", function() {
        var game = rail.new_game(settings);
        expect(game).toBeDefined();
        expect(game.players).toBeDefined();
    });
});

describe("bidding", function() {
    var game;
    beforeEach(function() {
        var settings = rail_factory.Settings();
        settings.players = [2, 4, 9];
        game = rail.new_game(settings);
    });

    describe("for a new game", function() {
        it("begins immediately", function() {
            expect(rail.is_bidding_round(game)).toEqual(true);
        });

        it("starts with the first seat", function() {
            expect(rail.get_current_seat(game)).toEqual(0);
        });

        it("each player's bid is zero", function() {
            rail.get_seats(game).forEach(function(player) {
                expect(railp.get_bid(player)).toEqual(0);
            });
        });

        it("the top bid is zero", function() {
            expect(rail.get_top_bid(game)).toEqual(0);
        });
    });
    
    // The next_bidder function should be called after each time a player places a valid
    // bid. This tests that in all of the situations where it can be called, the right
    // stuff happens. Other calls that should result in the next player being set need
    // only spy on this being called to know that the right behavior is happening.
    //
    // Each test is run with the starting player being either the first, middle, or
    // last seat.
    describe("next_bidder", function() {
        it("advances the current seat", function() {
            var num_seats = 3;
            expect(rail.get_num_seats(game)).toEqual(num_seats);
            for (var i = 0; i < num_seats; i++) {
                // Reset the game state.
                var settings = rail_factory.Settings();
                settings.players = [2, 4, 9];
                game = rail.new_game(settings);
                game.first_seat = i;
                game.current_seat = i;
                
                // Perform the test.
                var next_seat = rail.get_next_seat(game);
                rail.next_bidder(game);
                expect(rail.get_current_seat(game)).toEqual(next_seat);
            }
        });

        it("skips players who have already passed", function() {
            var num_seats = 3;
            expect(rail.get_num_seats(game)).toEqual(num_seats);
            for (var i = 0; i < num_seats; i++) {
                // Set up the game state.
                var settings = rail_factory.Settings();
                settings.players = [2, 4, 9];
                game = rail.new_game(settings);
                game.first_seat = i;
                game.current_seat = i;
                var next_player = rail.get_next_player(game);
                railp.set_passed_bidding(next_player);

                // Perform the test.
                rail.next_bidder(game);
                var new_seat = rail.get_current_seat(game);
                expect(new_seat).toEqual((i + 2) % num_seats);
            }
        });

        it("ends the bidding if everyone has passed", function() {
            spyOn(rail, "end_bidding");
            var num_seats = 3;
            expect(rail.get_num_seats(game)).toEqual(num_seats);
            for (var i = 0; i < num_seats; i++) {
                // Set up the game state.
                var settings = rail_factory.Settings();
                settings.players = [2, 4, 9];
                game = rail.new_game(settings);
                game.first_seat = i;
                game.current_seat = i;
                var seats = rail.get_seats(game);
                for (var j = 0; j < num_seats; j++) {
                    railp.set_passed_bidding(seats[j]);
                }
                
                // Perform the test.
                expect(rail.end_bidding.calls.count()).toEqual(i);
                rail.next_bidder(game);
                expect(rail.end_bidding.calls.count()).toEqual(i + 1);
            }
        });

        it("ends the bidding if the next bidder has the highest bid", function() {
            spyOn(rail, "end_bidding");
            var num_seats = 3;
            expect(rail.get_num_seats(game)).toEqual(num_seats);
            for (var i = 0; i < num_seats; i++) {
                // Set up the game state.
                var settings = rail_factory.Settings();
                settings.players = [2, 4, 9];
                game = rail.new_game(settings);
                game.first_seat = i;
                game.current_seat = i;
                var seats = rail.get_seats(game);
                for (var j = 0; j < num_seats; j++) {
                    railp.set_passed_bidding(seats[j]);
                }
                railp.set_bid(rail.get_first_player(game), 5);
                
                // Perform the test.
                expect(rail.end_bidding.calls.count()).toEqual(i);
                rail.next_bidder(game);
                expect(rail.end_bidding.calls.count()).toEqual(i + 1);
            }
        });

        it("fails if the current round isn't for bidding", function() {
            game.round = 1;
            expect(function() { rail.next_bidder(game); }).toThrow();
        });
    });

    describe("end_bidding", function() {
        var seats;

        beforeEach(function() {
            seats = rail.get_seats(game);
            for (var i = 0; i < seats.length; i++) {
                railp.set_bid(seats[i], i + 2);
                seats[i].money = 10;
            }
        });

        it("fails if not in the bidding round", function() {
            game.round = 1;
            expect(function() { rail.end_bidding(game); }).toThrow();
        });

        it("advances the round to 1", function() {
            rail.end_bidding(game);
            expect(rail.get_round(game)).toEqual(1);
        });

        it("sets the first player to highest bidder, if any", function() {
            var player2 = rail.get_next_player(game);
            railp.set_bid(player2, 10);
            rail.end_bidding(game);
            expect(rail.get_current_player(game)).toEqual(player2);
            expect(rail.get_current_player(game)).toEqual(rail.get_first_player(game));
        });

        it("makes the only top bidder pay for his bid", function() {
            spyOn(rail, "pay");
            rail.end_bidding(game);
            expect(rail.pay.calls.count()).toEqual(1);
            expect(rail.pay).toHaveBeenCalledWith(game, seats[2].id, 4);
        });

        it("clears all the player bids", function() {
            rail.end_bidding(game);
            for (var i = 0; i < seats.length; i++) {
                expect(railp.get_bid(seats[i])).toEqual(0);
            }
        });

        it("advances the first player by 1 if no bids placed", function() {
            for (var i = 0; i < seats.length; i++) {
                railp.set_passed_bidding(seats[i]);
            }
            var next_player = rail.get_next_player(game);
            rail.end_bidding(game);
            expect(rail.get_first_player(game)).toEqual(next_player);
        });

        it("fails if anyone has not yet bid", function() {
            for (var i = 0; i < seats.length; i++) {
                railp.clear_bid(seats[i]);
            }
            expect(function() { rail.end_bidding(game); }).toThrow();
        });
    });

    describe("pay", function() {
        var player;

        beforeEach(function() {
            player = rail.get_first_player(game);
            railp.adjust_money(player, 10);
        });

        it("relieves the player of his money", function() {
            rail.pay(game, player.id, 3);
            expect(railp.get_money(player)).toEqual(7);
        });

        it("sells shares if the player doesn't have enough money", function() {
            rail.pay(game, player.id, 17);
            expect(railp.get_money(player)).toEqual(3);
            expect(railp.get_shares(player)).toEqual(2);
        });
    });

    describe("placing a bid", function() {
        var bid_with_current_player = function(amount) {
            var player = rail.get_current_player(game);
            rail.bid_for_first_seat(game, player.id, amount);
        };

        it("increases the top bid", function() {
            bid_with_current_player(1);
            expect(rail.get_top_bid(game)).toEqual(1);
        });

        it("increases the bidder's bid", function() {
            var player = rail.get_current_player(game);
            rail.bid_for_first_seat(game, player.id, 1);
            var bid = railp.get_bid(player);
            expect(bid).toEqual(1);
        });

        it("advances the current player", function() {
            spyOn(rail, "next_bidder");
            expect(rail.next_bidder.calls.count()).toEqual(0);
            bid_with_current_player(1);
            expect(rail.next_bidder.calls.count()).toEqual(1);
        });

        it("fails if you aren't the current player", function() {
            var first_seat = rail.get_player_by_seat(game, 0);
            expect(function() {
                rail.bid_for_first_seat(game, first_seat.id + 1, 1);
            }).toThrow();
        });

        it("fails if the bid is less than the current bid", function() {
            var seats = rail.get_seats(game);
            rail.bid_for_first_seat(game, seats[0].id, 3);
            expect(function() { rail.bid_for_first_seat(game, seats[1].id, 1); }).toThrow();
            expect(function() { rail.bid_for_first_seat(game, seats[1].id, 2); }).toThrow();
            expect(function() { rail.bid_for_first_seat(game, seats[1].id, 3); }).toThrow();
            expect(function() { rail.bid_for_first_seat(game, seats[1].id, 4); }).not.toThrow();
        });

        it("fails if the current round isn't for bidding", function() {
            game.round = 1;
            var player = rail.get_current_player(game);
            expect(function() { bid_with_current_player(2); }).toThrow();
        });
    });

    describe("passing a bid", function() {
        it("sets the current player to have passed bidding", function() {
            var player = rail.get_current_player(game);
            expect(railp.has_passed_bidding(player)).toEqual(false);
            rail.pass_bidding(game, player.id);
            expect(railp.has_passed_bidding(player)).toEqual(true);
        });

        it("fails if you aren't the current player", function() {
            var player = rail.get_next_player(game);
            expect(function() { rail.pass_bidding(game, player.id); }).toThrow();
        });

        it("advances the current player", function() {
            spyOn(rail, "next_bidder");
            expect(rail.next_bidder.calls.count()).toEqual(0);
            rail.pass_bidding(game, rail.get_current_player(game).id);
            expect(rail.next_bidder.calls.count()).toEqual(1);
        });

        it("fails if the current round isn't for bidding", function() {
            game.round = 1;
            var player = rail.get_current_player(game);
            expect(function() { rail.pass_bidding(game, player.id); }).toThrow();
        });
    });

});

// The next_player function is a fundamental part of the game and used in all player actions.
// It is tested thoroughly here so that it can just be tested that it is called in the
// player actions.
// describe("next_player", function() {
//     var game;

//     beforeEach(function() {
//         game = new railState();
//         game.num_players = 2
//         game.first_player = 0;
//         game.current_player = 0;
//         game.round = 1;
//     });

//     it("advances to the next player", function() {
//         rail.next_player(game);
//         expect(game.current_player).toEqual(1);
//     });

//     it("advances the round when the current player is the last player", function() {
//         rail.next_player(game);
//         rail.next_player(game);
//         expect(game.current_player).toEqual(0);
//         expect(game.round).toEqual(2);
//     });

//     it("ends the turn after round 3", function() {
//         spyOn(rail, "end_turn");

//         rail.next_player(game);
//         rail.next_player(game);
//         rail.next_player(game);
//         rail.next_player(game);
//         rail.next_player(game);
//         rail.next_player(game);
        
//         expect(rail.end_turn.calls.count()).toEqual(1);
//     });
// });
