var root = require("../../src/gamestate");
var raila = root.Action;
var railc = root.City;
var railf = root.Factory;
var railg = root.Game;
var railm = root.Map;
var railp = root.Player;

function create_test_game_one() {
    var city0 = railf.City();
    city0.size = 3;
    city0.color = root.Color.colors.Yellow;

    var city1 = railf.City();
    city1.size = 4;
    city1.color = root.Color.colors.Red;

    var city2 = railf.City();
    city2.size = 1;
    city2.color = root.Color.colors.Gray;

    var map = railf.Map();
    railm.Builder.initialize_terrain(map, 5, 5);
    railm.Builder.insert_city(map, city0, 0, 2);
    railm.Builder.insert_city(map, city2, 2, 2);
    railm.Builder.insert_city(map, city1, 4, 2);

    var settings = railf.Settings();
    settings.players = [2, 4, 9];
    settings.map = map;
    return railg.new_game(settings);
};

describe("Map", function() {
    var map;
    beforeEach(function() {
        var city0 = railf.City();
        city0.size = 3;
        city0.color = root.Color.colors.Yellow;

        var city1 = railf.City();
        city1.size = 4;
        city1.color = root.Color.colors.Red;

        map = railf.Map();
        railm.Builder.initialize_terrain(map, 5, 5);
        railm.Builder.insert_city(map, city0, 2, 2);
        railm.Builder.insert_city(map, city1, 4, 3);

        // Ensure the map we set up is valid.
        railm.check_city_ids(map);
        railm.check_city_locations(map);
    });

    describe("is_city", function() {
        it("returns true for hexes containing cities", function() {
            expect(railm.is_city(map, railf.Hex(2, 2))).toEqual(true);
            expect(railm.is_city(map, railf.Hex(4, 3))).toEqual(true);
        });

        it("returns false for all hexes on the map", function() {
            expect(railm.is_city(map, railf.Hex(0, 0))).toEqual(false);
            expect(railm.is_city(map, railf.Hex(2, 3))).toEqual(false);
            expect(railm.is_city(map, railf.Hex(3, 2))).toEqual(false);
            expect(railm.is_city(map, railf.Hex(1, 1))).toEqual(false);
        });

        it("fails for hexes off the map", function() {
            expect(function() { railm.is_city(map, railf.Hex(10, 10)); }).toThrow();
            expect(function() { railm.is_city(map, railf.Hex(-1, -1)); }).toThrow();
        });
    });

    describe("seed_cubes", function() {
        it("adds cubes to each city equal to that city's size", function() {
            railm.seed_cubes(map);

            var cities = railm.get_cities(map);
            for (var i = 0; i < cities.length; i++) {
                var num_cubes = railc.num_cubes_remaining(cities[i]);
                expect(num_cubes).toEqual(railc.get_size(cities[i]));
            }
        });
    });
});

describe("Game", function() {
    beforeEach(function() {
        var settings = railf.Settings();
        settings.players = [7, 2, 3];
        settings.map = railf.Map();
        game = railg.new_game(settings);
    });
    
    describe("pay", function() {
        var player;

        beforeEach(function() {
            player = railg.get_first_player(game);
            railp.adjust_money(player, 10);
        });

        it("relieves the player of his money", function() {
            railg.pay(game, player.id, 3);
            expect(railp.get_money(player)).toEqual(7);
        });

        it("sells shares if the player doesn't have enough money", function() {
            railg.pay(game, player.id, 17);
            expect(railp.get_money(player)).toEqual(3);
            expect(railp.get_shares(player)).toEqual(2);
        });
    });

    describe("Track", function() {
        describe("is_valid_path", function() {
            beforeEach(function() {
                var city0 = railf.City();
                city0.size = 3;
                city0.color = root.Color.colors.Yellow;

                var city1 = railf.City();
                city1.size = 4;
                city1.color = root.Color.colors.Red;

                var city2 = railf.City();
                city2.size = 1;
                city2.color = root.Color.colors.Gray;

                var map = railf.Map();
                railm.Builder.initialize_terrain(map, 5, 5);
                railm.Builder.insert_city(map, city0, 0, 2);
                railm.Builder.insert_city(map, city2, 2, 2);
                railm.Builder.insert_city(map, city1, 4, 2);

                var settings = railf.Settings();
                settings.players = [2, 4, 9];
                settings.map = map;
                game = railg.new_game(settings);
            });            

            it("fails if the path is empty", function() {
                var path = [
                    railf.Hex(0,2),
                    railf.Hex(1,2),
                ]

                expect(function() { railm.is_valid_path(game.map, path); }).toThrowError(/too short/);
            });

            it("fails if hexes are off the map", function() {
                var path = [
                    railf.Hex(1,4),
                    railf.Hex(2,5),  // Off the map edge.
                    railf.Hex(3,4),
                ];

                expect(function() { railm.is_valid_path(game.map, path); }).toThrowError(/off the map/);
            });

            it("fails if the path crosses a city", function() {
                var path = [
                    railf.Hex(0,2),
                    railf.Hex(1,2),
                    railf.Hex(2,2), // City position
                    railf.Hex(3,2),
                ];

                expect(function() { railm.is_valid_path(game.map, path); }).toThrowError(/through city/);
            });

            it("fails if the path is not contiguous", function() {
                var path = [
                    railf.Hex(4,2),
                    railf.Hex(3,2),
                    railf.Hex(1,2),
                    railf.Hex(0,2),
                ];

                expect(function() { railm.is_valid_path(game.map, path); }).toThrowError(/contiguous/);
            });

            it("fails if the path has a too-sharp curve", function() {
                var path = [
                    railf.Hex(2,2),
                    railf.Hex(2,3),
                    railf.Hex(3,2),
                    railf.Hex(4,2),
                ];

                expect(function() { railm.is_valid_path(game.map, path); }).toThrowError(/curve/);
            });

            it("fails if the path crosses itself", function() {
                var path = [
                    railf.Hex(0,2),
                    railf.Hex(1,2),
                    railf.Hex(2,3),
                    railf.Hex(3,2),
                    railf.Hex(3,1),
                    railf.Hex(2,1),
                    railf.Hex(1,1),
                    railf.Hex(0,2),
                ]

                //TODO:
                // - make a hex equality function
                // - test if each hex in the path is unique

                expect(function() { railm.is_valid_path(game.map, path); }).toThrowError(/loop/);
            });

            xit("fails if there are already two tracks through one hex", function() {
            });
        });
    });
});

describe("new_game", function() {
    var settings;

    beforeEach(function() {
        settings = railf.Settings();
        settings.players = [7, 2, 3];
        settings.map = railf.Map();
    });

    it("requires a settings object", function() {
        expect(function() { railg.new_game(); }).toThrow();
    });

    it("requires 2 to 6 players", function() {
        settings.players = [1];
        expect(function() { railg.new_game(settings); }).toThrow();
        settings.players.push(2);
        expect(function() { railg.new_game(settings); }).not.toThrow();
        settings.players.push(3);
        expect(function() { railg.new_game(settings); }).not.toThrow();
        settings.players.push(4);
        expect(function() { railg.new_game(settings); }).not.toThrow();
        settings.players.push(5);
        expect(function() { railg.new_game(settings); }).not.toThrow();
        settings.players.push(6);
        expect(function() { railg.new_game(settings); }).not.toThrow();
        settings.players.push(7);
        expect(function() { railg.new_game(settings); }).toThrow();
    });

    describe("initializes a player object for each player", function() {
        var game;

        beforeEach(function() {
            game = railg.new_game(settings);
        });

        it("with the correct ids", function() {
            expect(railg.num_players(game)).toEqual(3);
            expect(railg.get_player_by_id(game, 7)).toBeDefined();
            expect(railg.get_player_by_id(game, 2)).toBeDefined();
            expect(railg.get_player_by_id(game, 3)).toBeDefined();
        });

        it("with correct initial values", function() {
            for (var i = 0; i < settings.players.length; i++) {
                var player = railg.get_player_by_id(game, settings.players[i]);
                expect(player.shares).toEqual(0);
                expect(player.money).toEqual(0);
                expect(player.points).toEqual(0);
                expect(player.engine).toEqual(1);
                expect(player.cards.length).toEqual(0);
            }
        });
    });

    it("adds cubes to each city", function() {
        spyOn(railm, "seed_cubes");
        game = railg.new_game(settings);
        expect(railm.seed_cubes.calls.count()).toEqual(1);
        expect(railm.seed_cubes.calls.argsFor(0)).toEqual([game.map]);
    });

    it("returns a game state", function() {
        var game = railg.new_game(settings);
        expect(game).toBeDefined();
        expect(game.players).toBeDefined();
    });
});

describe("bidding", function() {
    var game;
    beforeEach(function() {
        var settings = railf.Settings();
        settings.players = [2, 4, 9];
        settings.map = railf.Map();
        game = railg.new_game(settings);
    });

    describe("for a new game", function() {
        it("begins immediately", function() {
            expect(railg.is_bidding_round(game)).toEqual(true);
        });

        it("starts with the first seat", function() {
            expect(railg.get_current_seat(game)).toEqual(0);
        });

        it("each player's bid is zero", function() {
            railg.get_seats(game).forEach(function(player) {
                expect(railp.get_bid(player)).toEqual(0);
            });
        });

        it("the top bid is zero", function() {
            expect(railg.get_top_bid(game)).toEqual(0);
        });
    });

    describe("add_track", function() {
        it("combines incomplete tracks", function() {
            game = create_test_game_one();
            
            var path_a = [
                railf.Hex(0,2),
                railf.Hex(1,2),
                railf.Hex(2,3),
            ];
            var path_b = [
                railf.Hex(1,2),
                railf.Hex(2,3),
                railf.Hex(3,2),
            ];
            var path_c = [
                railf.Hex(2,3),
                railf.Hex(3,2),
                railf.Hex(4,2),
            ];

            var pid = railg.get_current_player(game).id;
            railg.add_track(game, pid, path_a);
            railg.add_track(game, pid, path_b);
            railg.add_track(game, pid, path_c);

            var tracks = railg.get_track_array(game);
            expect(tracks.length).toEqual(1);
            expect(tracks[0].owner).toEqual(pid);
            expect(tracks[0].complete).toEqual(true);
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
        var settings = railf.Settings();
        settings.players = [2, 4, 9];
        settings.map = railf.Map();

        it("advances the current seat", function() {
            var num_seats = 3;
            expect(railg.get_num_seats(game)).toEqual(num_seats);
            for (var i = 0; i < num_seats; i++) {
                // Reset the game state.
                game = railg.new_game(settings);
                game.first_seat = i;
                game.current_seat = i;
                
                // Perform the test.
                var next_seat = railg.get_next_seat(game);
                railg.next_bidder(game);
                expect(railg.get_current_seat(game)).toEqual(next_seat);
            }
        });

        it("skips players who have already passed", function() {
            var num_seats = 3;
            expect(railg.get_num_seats(game)).toEqual(num_seats);
            for (var i = 0; i < num_seats; i++) {
                // Set up the game state.
                game = railg.new_game(settings);
                game.first_seat = i;
                game.current_seat = i;
                var next_player = railg.get_next_player(game);
                railp.set_passed_bidding(next_player);

                // Perform the test.
                railg.next_bidder(game);
                var new_seat = railg.get_current_seat(game);
                expect(new_seat).toEqual((i + 2) % num_seats);
            }
        });

        it("ends the bidding if everyone has passed", function() {
            spyOn(railg, "end_bidding");
            var num_seats = 3;
            expect(railg.get_num_seats(game)).toEqual(num_seats);
            for (var i = 0; i < num_seats; i++) {
                // Set up the game state.
                game.first_seat = i;
                game.current_seat = i;
                var seats = railg.get_seats(game);
                for (var j = 0; j < num_seats; j++) {
                    railp.set_passed_bidding(seats[j]);
                }
                
                // Perform the test.
                expect(railg.end_bidding.calls.count()).toEqual(i);
                railg.next_bidder(game);
                expect(railg.end_bidding.calls.count()).toEqual(i + 1);
            }
        });

        it("ends the bidding if the next bidder has the highest bid", function() {
            spyOn(railg, "end_bidding");
            var num_seats = 3;
            expect(railg.get_num_seats(game)).toEqual(num_seats);
            for (var i = 0; i < num_seats; i++) {
                // Set up the game state.
                game = railg.new_game(settings);
                game.first_seat = i;
                game.current_seat = i;
                var seats = railg.get_seats(game);
                for (var j = 0; j < num_seats; j++) {
                    railp.set_passed_bidding(seats[j]);
                }
                railp.set_bid(railg.get_first_player(game), 5);
                
                // Perform the test.
                expect(railg.end_bidding.calls.count()).toEqual(i);
                railg.next_bidder(game);
                expect(railg.end_bidding.calls.count()).toEqual(i + 1);
            }
        });

        it("fails if the current round isn't for bidding", function() {
            game.round = 1;
            expect(function() { railg.next_bidder(game); }).toThrow();
        });
    });

    describe("end_bidding", function() {
        var seats;

        beforeEach(function() {
            seats = railg.get_seats(game);
            for (var i = 0; i < seats.length; i++) {
                railp.set_bid(seats[i], i + 2);
                seats[i].money = 10;
            }
        });

        it("fails if not in the bidding round", function() {
            game.round = 1;
            expect(function() { railg.end_bidding(game); }).toThrow();
        });

        it("advances the round to 1", function() {
            railg.end_bidding(game);
            expect(railg.get_round(game)).toEqual(1);
        });

        it("sets the first player to highest bidder, if any", function() {
            var player2 = railg.get_next_player(game);
            railp.set_bid(player2, 10);
            railg.end_bidding(game);
            expect(railg.get_current_player(game)).toEqual(player2);
            expect(railg.get_current_player(game)).toEqual(railg.get_first_player(game));
        });

        it("makes the only top bidder pay for his bid", function() {
            spyOn(railg, "pay");
            railg.end_bidding(game);
            expect(railg.pay.calls.count()).toEqual(1);
            expect(railg.pay).toHaveBeenCalledWith(game, seats[2].id, 4);
        });

        it("clears all the player bids", function() {
            railg.end_bidding(game);
            for (var i = 0; i < seats.length; i++) {
                expect(railp.get_bid(seats[i])).toEqual(0);
            }
        });

        it("advances the first player by 1 if no bids placed", function() {
            for (var i = 0; i < seats.length; i++) {
                railp.set_passed_bidding(seats[i]);
            }
            var next_player = railg.get_next_player(game);
            railg.end_bidding(game);
            expect(railg.get_first_player(game)).toEqual(next_player);
        });

        it("fails if anyone has not yet bid", function() {
            for (var i = 0; i < seats.length; i++) {
                railp.clear_bid(seats[i]);
            }
            expect(function() { railg.end_bidding(game); }).toThrow();
        });
    });

    describe("placing a bid", function() {
        var bid_with_current_player = function(amount) {
            var player = railg.get_current_player(game);
            raila.bid_for_first_seat(game, player.id, amount);
        };

        it("increases the top bid", function() {
            bid_with_current_player(1);
            expect(railg.get_top_bid(game)).toEqual(1);
        });

        it("increases the bidder's bid", function() {
            var player = railg.get_current_player(game);
            raila.bid_for_first_seat(game, player.id, 1);
            var bid = railp.get_bid(player);
            expect(bid).toEqual(1);
        });

        it("advances the current player", function() {
            spyOn(railg, "next_bidder");
            expect(railg.next_bidder.calls.count()).toEqual(0);
            bid_with_current_player(1);
            expect(railg.next_bidder.calls.count()).toEqual(1);
        });

        it("fails if you aren't the current player", function() {
            var first_seat = railg.get_player_by_seat(game, 0);
            expect(function() {
                raila.bid_for_first_seat(game, first_seat.id + 1, 1);
            }).toThrow();
        });

        it("fails if the bid is less than the current bid", function() {
            var seats = railg.get_seats(game);
            raila.bid_for_first_seat(game, seats[0].id, 3);
            expect(function() { raila.bid_for_first_seat(game, seats[1].id, 1); }).toThrow();
            expect(function() { raila.bid_for_first_seat(game, seats[1].id, 2); }).toThrow();
            expect(function() { raila.bid_for_first_seat(game, seats[1].id, 3); }).toThrow();
            expect(function() { raila.bid_for_first_seat(game, seats[1].id, 4); }).not.toThrow();
        });

        it("fails if the current round isn't for bidding", function() {
            game.round = 1;
            var player = railg.get_current_player(game);
            expect(function() { bid_with_current_player(2); }).toThrow();
        });
    });

    describe("passing a bid", function() {
        it("sets the current player to have passed bidding", function() {
            var player = railg.get_current_player(game);
            expect(railp.has_passed_bidding(player)).toEqual(false);
            raila.pass_bidding(game, player.id);
            expect(railp.has_passed_bidding(player)).toEqual(true);
        });

        it("fails if you aren't the current player", function() {
            var player = railg.get_next_player(game);
            expect(function() { raila.pass_bidding(game, player.id); }).toThrow();
        });

        it("advances the current player", function() {
            spyOn(railg, "next_bidder");
            expect(railg.next_bidder.calls.count()).toEqual(0);
            raila.pass_bidding(game, railg.get_current_player(game).id);
            expect(railg.next_bidder.calls.count()).toEqual(1);
        });

        it("fails if the current round isn't for bidding", function() {
            game.round = 1;
            var player = railg.get_current_player(game);
            expect(function() { raila.pass_bidding(game, player.id); }).toThrow();
        });
    });
});

describe("player actions", function() {
    var game;

    beforeEach(function() {
        game = create_test_game_one();

        // Move to the action phase of the game.
        var seats = railg.get_seats(game);
        for (var i = 0; i < seats.length; i++) {
            raila.pass_bidding(game, seats[i].id);
        }

        spyOn(railg, 'end_turn');
    });

    describe("pass_turn", function() {
        it("works only for the current player", function() {
            var next_player = railg.get_next_player(game);
            expect(function() { raila.pass_turn(game, next_player.id); }).toThrow();

            var current_player = railg.get_current_player(game);
            expect(function() { raila.pass_turn(game, current_player.id); }).not.toThrow();
        });

        it("ends the current player's turn", function() {
            raila.pass_turn(game, railg.get_current_player(game).id);
            expect(railg.end_turn.calls.count()).toEqual(1);
        });
    });

    describe("build_track", function() {
        var short_track;
        var current_player;
        beforeEach(function() {
            short_track = [
                railf.Hex(0,2),
                railf.Hex(1,2),
                railf.Hex(2,2),
            ];

            current_player = railg.get_current_player(game);
        });

        it("works only for the current player", function() {
            var next_player = railg.get_next_player(game);
            expect(function() { raila.build_track(game, next_player.id, short_track); }).toThrowError(/not this player/);
            expect(function() { raila.build_track(game, current_player.id, short_track); }).not.toThrow();
        });

        it("ends the current player's turn", function() {
            raila.build_track(game, current_player.id, short_track);
            expect(railg.end_turn.calls.count()).toEqual(1);
        });

        it("fails if the user doesn't build any tracks", function() {
            var very_short_path = [
                railf.Hex(0,2),
                railf.Hex(1,2),
            ];
            expect(function() { raila.build_track(game, current_player.id, very_short_path); }).toThrowError(/No tracks/);
        });

        it("fails if the user tries to build too many tracks", function() {
            var long_track = [
                railf.Hex(0,0),
                railf.Hex(0,1),
                railf.Hex(0,2),
                railf.Hex(0,3),
                railf.Hex(1,3),
                railf.Hex(2,3),
                railf.Hex(2,2),
            ];
            expect(function() { raila.build_track(game, current_player.id, long_track); }).toThrowError(/4 hexes/);
        });

        xit("fails if the player already has a track connecting these cities", function() {
        });

        it("adds the track to the game state", function() {
            spyOn(railg, "add_track");
            raila.build_track(game, current_player.id, short_track);
            expect(railg.add_track.calls.count()).toEqual(1);
            expect(railg.add_track).toHaveBeenCalledWith(game, current_player.id, short_track);
        });
        
    });
});
