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
    city0.color = root.Color.colors.YELLOW;

    var city1 = railf.City();
    city1.size = 1;
    city1.color = root.Color.colors.RED;

    var city2 = railf.City();
    city2.size = 4;
    city2.color = root.Color.colors.GRAY;

    var map = railf.Map();
    railm.Builder.initialize_terrain(map, 5, 5);
    railm.Builder.insert_city(map, city0, 0, 2);
    railm.Builder.insert_city(map, city1, 2, 2);
    railm.Builder.insert_city(map, city2, 4, 2);

    var settings = railf.Settings();
    settings.players = [2, 4, 9];
    settings.map = map;
    return railg.new_game(settings);
};

function set_current_player(game_state, player) {
    var seats = railg.get_seats(game_state);
    for (var i = 0; i < seats.length; i++) {
        if (seats[i].id == player.id) {
            game_state.current_seat = i;
            return;
        }
    }
    throw new Error("Couldn't find player.");
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
    
    describe("add_track", function() {
        it("fails if the player already has a track connecting these cities", function() {
            game = create_test_game_one();
            
            var path_a = [
                railf.Hex(0,2),
                railf.Hex(1,2),
                railf.Hex(2,2),
            ];
            var path_b = [
                railf.Hex(0,2),
                railf.Hex(1,1),
                railf.Hex(2,2),
            ];;

            var pid = railg.get_current_player(game).id;
            railg.add_track(game, pid, path_a);
            expect(function() { railg.add_track(game, pid, path_b); }).toThrowError(/existing route/);
        });

        it("fails if a hex already contains two tracks", function() {
            game = create_test_game_one();

            var path_a = [
                railf.Hex(0,2),
                railf.Hex(0,3),
                railf.Hex(1,3),
                railf.Hex(2,3),
                railf.Hex(2,2),
            ];
            
            var path_b = [
                railf.Hex(0,2),
                railf.Hex(1,2),
                railf.Hex(2,3),
                railf.Hex(3,3),
                railf.Hex(4,3),
                railf.Hex(4,2),
            ];

            var path_c = [
                railf.Hex(4,2),
                railf.Hex(3,2),
                railf.Hex(2,3),
                railf.Hex(2,4),
            ];

            var pid = railg.get_current_player(game).id;
            railg.add_track(game, pid, path_a);
            railg.add_track(game, pid, path_b);
            
            expect(function() { railg.add_track(game, pid, path_c); }).toThrowError(/too many/);
        });

        it("fails if two tracks enter or exit the same side of a hex", function() {
            game = create_test_game_one();
            
            var path_a = [
                railf.Hex(0,2),
                railf.Hex(0,3),
                railf.Hex(1,3),
                railf.Hex(2,3),
                railf.Hex(2,2),
            ];

            var path_b = [
                railf.Hex(4,2),
                railf.Hex(4,3),
                railf.Hex(3,3),
                railf.Hex(2,3),
                railf.Hex(2,2),
            ];

            var pid = railg.get_current_player(game).id;
            railg.add_track(game, pid, path_a);

            expect(function() { railg.add_track(game, pid, path_b); }).toThrowError(/overlap/);
        });

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

    describe("cost_for_track", function() {
        beforeEach(function() {
            game = create_test_game_one();

            // Modify the terrain so that it contains all the different types.
            // p p c p p
            //  p r p h h
            // p r c h h
            //  r p r p p
            // p p c r p

            var map = game.map;
            railm.Builder.set_terrain_type(map, railm.Terrain.RIVER, 1, 1);
            railm.Builder.set_terrain_type(map, railm.Terrain.RIVER, 2, 1);
            railm.Builder.set_terrain_type(map, railm.Terrain.RIVER, 3, 0);
            railm.Builder.set_terrain_type(map, railm.Terrain.RIVER, 3, 2);
            railm.Builder.set_terrain_type(map, railm.Terrain.RIVER, 4, 3);

            railm.Builder.set_terrain_type(map, railm.Terrain.HILLS, 1, 3);
            railm.Builder.set_terrain_type(map, railm.Terrain.HILLS, 1, 4);
            railm.Builder.set_terrain_type(map, railm.Terrain.HILLS, 2, 3);
            railm.Builder.set_terrain_type(map, railm.Terrain.HILLS, 2, 4);

            railm.Builder.add_ridge(map, 1, 3, 2, 3);
        });

        it("works correctly for ordinary terrain", function() {
            var path = [
                railf.Hex(0,2),
                railf.Hex(1,2),  // plains = 2
                railf.Hex(2,3),  // hills  = 4
                railf.Hex(3,2),  // river  = 3
                railf.Hex(4,2),
            ];
            expect(railg.cost_for_track(game, path)).toEqual(2 + 4 + 3);
        });

        it("works correctly across ridges", function() {
            var path = [
                railf.Hex(0,2),
                railf.Hex(0,3),  // plains = 2
                railf.Hex(1,3),  // hills  = 4 \__ ridge = 4
                railf.Hex(2,3),  // hills  = 4 /
                railf.Hex(2,2),
            ];
            expect(railg.cost_for_track(game, path)).toEqual(2 + 4 + 4 + 4);
        });

        it("works correctly across existing tracks", function() {
            var path1 = [
                railf.Hex(0,2),
                railf.Hex(1,2),  // plains = 2
                railf.Hex(2,3),  // hills  = 4
                railf.Hex(3,2),  // river  = 3
                railf.Hex(4,2),
            ];
            railg.add_track(game, railg.get_current_player(game).id, path1);

            var path2 = [
                railf.Hex(0,2),
                railf.Hex(0,3),  // plains = 2
                railf.Hex(1,3),  // hills  = 4 \__ ridge = 4
                railf.Hex(2,3),  // hills  = 4 /  -- crosses track = 2
                railf.Hex(2,2),
            ];

            expect(railg.cost_for_track(game, path2)).toEqual(2 + 4 + 4 + 4 + 2);
        });

        it("charges half the cost for a ridge if you don't cross it yet", function() {
            // When the player builds a track in stages, sometimes he may build a track
            // up to a ridge, but not build across it. In this case, we charge half the
            // ridge cost, and charge half again when he builds the rest of the track.
            var path = [
                railf.Hex(0,2),
                railf.Hex(0,3),  // plains = 2
                railf.Hex(1,3),  // hills  = 4 \__ half ridge = 2
                railf.Hex(2,3),  //            /
            ];
            expect(railg.cost_for_track(game, path)).toEqual(2 + 4 + 2);
        });
    });
});

describe("Map", function() {
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
            expect(railg.end_turn).toHaveBeenCalledTimes(1);
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

        it("adds the track to the game state", function() {
            spyOn(railg, "add_track");
            raila.build_track(game, current_player.id, short_track);
            expect(railg.add_track.calls.count()).toEqual(1);
            expect(railg.add_track).toHaveBeenCalledWith(game, current_player.id, short_track);
        });

        it("makes the player pay", function() {
            spyOn(railg, "pay");
            spyOn(railg, "cost_for_track")
            raila.build_track(game, current_player.id, short_track);
            expect(railg.cost_for_track.calls.count()).toEqual(1);
            expect(railg.pay.calls.count()).toEqual(1);
        });
    });

    describe("deliver_goods", function() {

        function adjust_cubes(game_state, city_hex, cubes) {
            railm.get_city_by_hex(game_state.map, city_hex).cubes = cubes;
        };

        var current_player;
        var next_player;
        var track_a_id;
        var track_b_id;
        var track_c_id;

        beforeEach(function() {
            game = create_test_game_one();
            current_player = railg.get_current_player(game);
            next_player = railg.get_next_player(game);

            railp.increment_engine(current_player);
            railp.increment_engine(next_player);

            var path_a = [
                railf.Hex(0,2),
                railf.Hex(1,2),
                railf.Hex(2,2),
            ];

            var path_b = [
                railf.Hex(4,2),
                railf.Hex(3,1),
                railf.Hex(2,1),
                railf.Hex(1,0),
                railf.Hex(0,1),
                railf.Hex(0,2),
            ];

            var path_c = [
                railf.Hex(0,2),
                railf.Hex(1,1),
                railf.Hex(2,2),
            ];

            track_a_id = railg.add_track(game, current_player.id, path_a).id;
            track_b_id = railg.add_track(game, current_player.id, path_b).id;
            track_c_id = railg.add_track(game, next_player.id, path_c).id;

            adjust_cubes(game, railf.Hex(0,2), railf.Cubes());
            adjust_cubes(game, railf.Hex(2,2), railf.Cubes());

            var cubes42 = railf.Cubes();
            cubes42[root.Color.colors.RED   ] = 1;
            cubes42[root.Color.colors.YELLOW] = 1;
            adjust_cubes(game, railf.Hex(4,2), cubes42);
        });

        it("works only for the current player", function() {
            var city = railm.get_city_by_hex(game.map, railf.Hex(4,2));

            expect(function() {
                raila.deliver_goods(game, next_player.id, city.id, [track_b_id, track_a_id]);
            }).toThrowError(/not this player/);

            expect(function() {
                raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_a_id]);
            }).not.toThrow();
        });

        it("ends the current player's turn", function() {
            var city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
            raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_c_id]);
            expect(railg.end_turn).toHaveBeenCalledTimes(1);
        });

        it("fails if the user doesn't control the first segment", function() {
            var city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
            set_current_player(game, next_player);
            expect(function() {
                raila.deliver_goods(game, next_player.id, city.id, [track_b_id, track_a_id]);
            }).toThrowError(/first segment/);
        });

        it("fails if the source city has no goods of the dest city color", function() {
            var city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
            city.cubes[root.Color.colors.RED] = 0;
            expect(function() {
                raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_a_id]);
            }).toThrowError(/no cubes/i);
        });

        it("fails if the player's engine isn't strong enough", function() {
            var city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
            current_player.engine = 1;
            expect(function() {
                raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_a_id]);
            }).toThrowError(/stronger engine/i);
        });

        it("fails if the path contains a loop", function() {
            var city = railm.get_city_by_hex(game.map, railf.Hex(0,2));
            city.cubes[root.Color.colors.YELLOW] = 1;
            
            railp.increment_engine(current_player);
            railp.increment_engine(current_player);
            railp.increment_engine(current_player);
            railp.increment_engine(current_player);
            
            expect(function() {
                raila.deliver_goods(game, current_player.id, city.id, [
                    track_a_id,
                    track_c_id,
                ]);
            }).toThrowError(/contains loop/i);
        });

        it("fails if the path contains a city the same color as the dest city", function() {
            var city0 = railm.get_city_by_hex(game.map, railf.Hex(0,2));
            city0.color = root.Color.colors.RED;
            // console.log(game.map.cities);

            var city1 = railm.get_city_by_hex(game.map, railf.Hex(4,2));

            expect(function() {
                raila.deliver_goods(game, current_player.id, city1.id, [track_b_id, track_a_id]);
            }).toThrowError(/color/i);
        });

        it("fails if the segments aren't contiguous", function() {
            var city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
            expect(function() {
                raila.deliver_goods(game, current_player.id, city.id, [track_a_id, track_b_id]);
            }).toThrowError(/contiguous/i);
        });

        it("distributes points for each track it crosses", function() {
            var city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
            raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_c_id]);
            expect(railp.get_score(current_player)).toEqual(1);
            expect(railp.get_score(next_player)).toEqual(1);
        });

        it("removes the correct cube from the source city", function() {
            var city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
            expect(railc.num_cubes_remaining(city)).toEqual(2);
            raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_a_id]);
            expect(railc.num_cubes_remaining(city)).toEqual(1);
            expect(city.cubes[root.Color.colors.RED]).toEqual(0);
            expect(city.cubes[root.Color.colors.YELLOW]).toEqual(1);
        });
    });
});
