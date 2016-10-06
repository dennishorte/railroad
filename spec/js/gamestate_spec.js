var root = require("../../src/gamestate");
var raila = root.Action;
var railc = root.City;
var railf = root.Factory;
var railg = root.Game;
var railm = root.Map;
var railp = root.Player;

function create_test_game_one_settings() {

    var city0   = railf.City();
    city0.id    = 1;
    city0.size  = 3;
    city0.name  = "Oakland";
    city0.color = root.Color.colors.YELLOW;

    var city1   = railf.City();
    city1.id    = 2;
    city1.size  = 4;
    city1.name  = "San Francisco";
    city1.color = root.Color.colors.RED;

    var city2   = railf.City();
    city2.id    = 3;
    city2.size  = 1;
    city2.name  = "El Cerrito";
    city2.color = root.Color.colors.GRAY;

    var city3   = railf.City();
    city3.id    = 4;
    city3.size  = 1;
    city3.name  = "Pinole";
    city3.color = root.Color.colors.BLUE;

    var map = railf.Map();
    railm.Builder.initialize_terrain(map, 5, 5);
    railm.Builder.insert_city(map, city0, 0, 2);
    railm.Builder.insert_city(map, city1, 2, 2);
    railm.Builder.insert_city(map, city2, 4, 2);
    railm.Builder.insert_city(map, city3, 1, 4);

    var settings = railf.Settings();
    settings.players = [2, 4, 9];
    settings.map = map;

    return settings;
};

function create_test_game_one() {
    var settings = create_test_game_one_settings();
    var game = railg.new_game(settings);
    game.round = 1;
    return game;
};

// function create_test_game_one_with_cards() {
//     var settings = create_test_game_one_settings();

//     var deck = root.Cards.DeckFactory(
//         Cards.MinorTypes.SERVICE_BOUNTY, [railm.get_city_by_id(1), 3],
//         Cards.MinorTypes.HOTEL         , [railm.get_city_by_id(2)],
//         Cards.MinorTypes.MAJOR_LINE    , [railm.get_city_by_id(1), railm.get_city_by_id(3), 5, false],
//         Cards.MinorTypes.RAILROAD_ERA  ,
//         Cards.MinorTypes.SPEED_RECORD  ,
//         Cards.MinorTypes.NEW_TRAIN     ,
//         Cards.MinorTypes.LAND_GRANT    ,
//         Cards.MinorTypes.LAND_GRANT    ,
//         Cards.MinorTypes.NEW_INDUSTRY  ,
//         Cards.MinorTypes.NEW_INDUSTRY  ,
//         Cards.MinorTypes.NEW_INDUSTRY  ,
//         Cards.MinorTypes.NEW_INDUSTRY  ,
//         Cards.MinorTypes.EXECUTIVE     ,
//         Cards.MinorTypes.EXECUTIVE     ,
//         Cards.MinorTypes.PERFECT_ENG   ,
//         Cards.MinorTypes.PERFECT_ENG   ,
//         Cards.MinorTypes.CITY_GROWTH
//         Cards.MinorTypes.CITY_GROWTH
//         Cards.MinorTypes.CITY_GROWTH
//     );

//     var game = railg.new_game(settings);
//     game.round = 1;
//     return game;
// };

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

describe("Cards", function() {
    var Cards = root.Cards;

    describe("DeckFactory", function() {
        it("creates card objects", function() {
            var deck = Cards.DeckFactory(
                Cards.MinorTypes.CITY_GROWTH,
                Cards.MinorTypes.PERFECT_ENG
            );

            expect(deck.length).toEqual(2);
        });

        it("allows parameters", function() {
            var city = railf.City();
            city.name = "New York";
            city.id = 8;

            var deck = Cards.DeckFactory(
                Cards.MinorTypes.CITY_GROWTH,
                Cards.MinorTypes.HOTEL, [city],
                Cards.MinorTypes.RAILROAD_ERA,
                Cards.MinorTypes.SERVICE_BOUNTY, [city, 3]
            );

            expect(deck.length).toEqual(4);
            expect(deck[1].city_id).toEqual(city.id);
            expect(deck[3].city_id).toEqual(city.id);
        });

        it("assigns unique ids to each card", function() {
            var city = railf.City();
            city.name = "New York";
            city.id = 8;

            var deck = Cards.DeckFactory(
                Cards.MinorTypes.CITY_GROWTH,
                Cards.MinorTypes.HOTEL, [city],
                Cards.MinorTypes.RAILROAD_ERA,
                Cards.MinorTypes.SERVICE_BOUNTY, [city, 3]
            );

            var ids = deck.map(function(card) {
                return card.id;
            });

            ids.sort();

            for (var i = 1; i < ids.length; i++) {
                expect(ids[i - 1]).not.toEqual(ids[i]);
            }

            for (var i = 0; i < ids.length; i++) {
                expect(ids[i] > 0).toEqual(true);
            }
        });
    });
});

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

    describe("add_card", function() {
        xit("hasn't been tested yet");
        // Take the top card from the deck, if any, and add it to the active_cards.
        // Don't deal cards that have already been dealt.
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
        var player;

        beforeEach(function() {
            game = create_test_game_one();
            player = railg.get_first_player(game);

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
            expect(railg.cost_for_track(game, player.id, path)).toEqual(2 + 4 + 3);
        });

        it("works correctly across ridges", function() {
            var path = [
                railf.Hex(0,2),
                railf.Hex(0,3),  // plains = 2
                railf.Hex(1,3),  // hills  = 4 \__ ridge = 4
                railf.Hex(2,3),  // hills  = 4 /
                railf.Hex(2,2),
            ];
            expect(railg.cost_for_track(game, player.id, path)).toEqual(2 + 4 + 4 + 4);
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

            expect(railg.cost_for_track(game, player.id, path2)).toEqual(2 + 4 + 4 + 4 + 2);
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
            expect(railg.cost_for_track(game, player.id, path)).toEqual(2 + 4 + 2);
        });
    });

    describe("end_player_turn", function() {
        var current_player;

        beforeEach(function() {
            game = create_test_game_one();
            current_player = railg.get_current_player(game);
        });

        it("works only for the current player", function() {
            var next_player = railg.get_next_player(game);
            
            expect(function() {
                railg.end_player_turn(game, next_player.id);
            }).toThrowError(/not this player/);

            expect(function() {
                railg.end_player_turn(game, current_player.id);
            }).not.toThrow();
        });

        it("advances to the next player", function() {
            var next_player = railg.get_next_player(game);
            railg.end_player_turn(game, current_player.id);
            expect(railg.get_current_player(game)).toEqual(next_player);
        });

        it("doesn't advance to the next player if using the executive card", function() {
            var Cards = root.Cards;
            game.deck = Cards.DeckFactory(
                Cards.MinorTypes.EXECUTIVE
            );
            game.cards_dealt = [game.deck[0].id];
            game.active_cards = [game.deck[0].id];

            raila.take_action_card(game, current_player.id, game.deck[0].id);

            railg.end_player_turn(game, current_player.id);
            expect(railg.get_current_player(game).id).toEqual(current_player.id);

            var next_player = railg.get_next_player(game);
            railg.end_player_turn(game, current_player.id);
            expect(railg.get_current_player(game)).toEqual(next_player);
        });

        it("advances the round marker after the last player", function() {
            expect(game.round).toEqual(1);
            var seats = railg.get_seats(game);
            seats.forEach(function(player) {
                railg.end_player_turn(game, player.id);
            });
            expect(game.round).toEqual(2);
        });

        it("calls end_game_turn after the last round finishes", function() {
            spyOn(railg, "end_game_turn");
            game.round = 3;
            game.current_seat = railg.get_last_seat(game);
            railg.end_player_turn(game, railg.get_last_player(game).id);
            expect(railg.end_game_turn).toHaveBeenCalledTimes(1);
        });
    });

    describe("end_game_turn", function() {
        beforeEach(function() {
            spyOn(railg, "add_card");
            game = create_test_game_one();
            game.round = 4;
            game.current_seat = railg.get_first_seat(game);
            if (game.current_seat < 0) {
                game.current_seat = game.players.length - 1;
            }
        });

        it("fails if not the last round of the turn", function() {
            game.round = 2;
            expect(function() {
                railg.end_game_turn(game);
            }).toThrowError(/end of the round/i);
        });

        it("fails if the current player is not the last player", function() {
            game.current_seat = railg.get_last_seat(game);
            expect(function() { railg.end_game_turn(game); }).toThrowError(/first player/i);
        });

        it("removes incomplete tracks", function() {
            var path_a = [
                railf.Hex(0,2),
                railf.Hex(1,2),
                railf.Hex(2,2),
            ];
            var path_b = [
                railf.Hex(0,2),
                railf.Hex(1,1),
                railf.Hex(2,1),
                railf.Hex(3,1),
            ];

            var current_player = railg.get_current_player(game);

            railg.add_track(game, current_player.id, path_b);
            railg.add_track(game, current_player.id, path_a);

            railg.end_game_turn(game);

            var tracks = railg.get_track_array(game);
            expect(tracks.length).toEqual(1);
            expect(tracks[0].path).toEqual(path_a);
        });

        it("pays players", function() {
            var seats = railg.get_seats(game);
            seats[0].points = 1;
            seats[1].points = 5;
            seats[1].shares = 1;
            seats[2].points = 1;
            seats[2].shares = 1;

            railg.end_game_turn(game);

            expect(seats[0].money).toEqual(3);
            expect(seats[1].money).toEqual(6);
            expect(seats[2].money).toEqual(2);
        });

        it("increments the turn", function() {
            var initial_turn = game.turn;
            railg.end_game_turn(game);
            expect(game.turn).toEqual(initial_turn + 1);
        });

        it("resets the round value", function() {
            railg.end_game_turn(game);
            expect(railg.is_bidding_round(game)).toEqual(true);
        });

        it("sets the current player to the first player", function() {
            railg.end_game_turn(game);
            expect(railg.get_current_player(game)).toEqual(railg.get_first_player(game));
        });

        it("reveals a new operations card", function() {
            railg.end_game_turn(game);
            expect(railg.add_card).toHaveBeenCalledTimes(1);
        });
    });

    describe("add_card", function() {
        var Cards = root.Cards;

        it("adds a new card to the available cards", function() {
            game.deck = Cards.DeckFactory(
                Cards.MinorTypes.RAILROAD_ERA
            );

            // Preconditions
            expect(game.active_cards.length).toEqual(0);
            expect(game.cards_dealt.length).toEqual(0);

            railg.add_card(game);
            expect(game.active_cards.length).toEqual(1);
            expect(game.cards_dealt.length).toEqual(1);
        });

        it("does nothing if the deck is empty", function() {
            // Preconditions
            expect(game.active_cards.length).toEqual(0);
            expect(game.cards_dealt.length).toEqual(0);

            railg.add_card(game);
            expect(game.active_cards.length).toEqual(0);
            expect(game.cards_dealt.length).toEqual(0);
        });

        it("triggers major line operations cards if they are flipped", function() {
            game = create_test_game_one();

            // Add a major line card to the card row.
            var Cards = root.Cards;
            var city0 = railm.get_city_by_hex(game.map, railf.Hex(0,2));
            var city1 = railm.get_city_by_hex(game.map, railf.Hex(4,2));
            game.deck = Cards.DeckFactory(
                Cards.MinorTypes.MAJOR_LINE, [city0, city1, 30, false]
            );

            // Build the major line.
            var current_player = railg.get_current_player(game);
            railg.add_track(game, current_player.id, [
                railf.Hex(0,2),
                railf.Hex(1,2),
                railf.Hex(2,2),
            ]);
            railg.add_track(game, current_player.id, [
                railf.Hex(2,2),
                railf.Hex(3,2),
                railf.Hex(4,2),
            ]);
            
            // Preconditions
            expect(railp.get_score(current_player)).toEqual(0);

            railg.add_card(game);
            expect(railp.get_score(current_player)).toEqual(30);
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
        spyOn(railg, 'end_player_turn');
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
            expect(railg.end_player_turn.calls.count()).toEqual(1);
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
            expect(railg.end_player_turn).toHaveBeenCalledTimes(1);
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

        it("allows building 5 tracks if the player has perfect engineering", function() {
            var Cards = root.Cards;
            game.deck = Cards.DeckFactory(
                Cards.MinorTypes.PERFECT_ENG
            );
            railp.add_card(current_player, game.deck[0].id);
            game.cards_dealt = [game.deck[0].id];
            
            var long_track = [
                railf.Hex(0,2),
                railf.Hex(0,1),
                railf.Hex(1,0),
                railf.Hex(2,0),
                railf.Hex(3,0),
                railf.Hex(4,1),
                railf.Hex(4,2),
            ];

            spyOn(railg, "add_track");
            raila.build_track(game, current_player.id, long_track);
            expect(railg.add_track.calls.count()).toEqual(1);
            expect(railg.add_track).toHaveBeenCalledWith(game, current_player.id, long_track);
        });

        describe("land grant", function() {
            beforeEach(function() {
                var Cards = root.Cards;
                game.deck = Cards.DeckFactory(
                    Cards.MinorTypes.LAND_GRANT
                );
                railp.add_card(current_player, game.deck[0].id);
                game.cards_dealt = [game.deck[0].id];
                raila.play_action_card(game, current_player.id, game.deck[0].id);
                railp.adjust_money(current_player, 10);
            });

            it("doesn't cost the player to build on flat land", function() {
                raila.build_track(game, current_player.id, short_track);
                expect(railp.get_money(current_player)).toEqual(10);
            });

            it("building on non-flat ground still costs", function() {
                var map = game.map;
                map.hexes[1][2] = railm.Terrain.RIVER;
                raila.build_track(game, current_player.id, short_track);
                expect(railp.get_money(current_player)).toEqual(7);
            });

            xit("doesn't carry over to following turns", function() {
            });
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

        it("awards points for major lines if completed", function() {
            // Add a major line card to the card row.
            var Cards = root.Cards;
            var city0 = railm.get_city_by_hex(game.map, railf.Hex(0,2));
            var city1 = railm.get_city_by_hex(game.map, railf.Hex(4,2));
            game.deck = Cards.DeckFactory(
                Cards.MinorTypes.MAJOR_LINE, [city0, city1, 30, false]
            );
            game.active_cards = [game.deck[0].id];

            // Build part of the major line (so we can complete it as our action.
            railg.add_track(game, current_player.id, [
                railf.Hex(0,2),
                railf.Hex(1,2),
                railf.Hex(2,2),
            ]);

            // Check the pre-conditions.
            expect(railp.get_score(current_player)).toEqual(0);
            expect(game.active_cards.length).toEqual(1);

            // Build the pieces of the major line.
            raila.build_track(game, current_player.id, [
                railf.Hex(2,2),
                railf.Hex(3,2),
                railf.Hex(4,2),
            ]);
            
            // Expect to get points for the card.
            expect(railp.get_score(current_player)).toEqual(30);

            // Expect the card to be gone from the row.
            expect(game.active_cards.length).toEqual(0);
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
            cubes42[root.Color.colors.BLUE  ] = 1;
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
            expect(railg.end_player_turn).toHaveBeenCalledTimes(1);
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
            expect(railc.num_cubes_remaining(city)).toEqual(3);
            raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_a_id]);
            expect(railc.num_cubes_remaining(city)).toEqual(2);
            expect(city.cubes[root.Color.colors.RED]).toEqual(0);
            expect(city.cubes[root.Color.colors.BLUE]).toEqual(1);
            expect(city.cubes[root.Color.colors.YELLOW]).toEqual(1);
        });

        it("triggers railroad era cards the first time a good is delivered", function() {
            var Cards = root.Cards;
            game.deck = Cards.DeckFactory(
                Cards.MinorTypes.RAILROAD_ERA
            );
            game.active_cards = [game.deck[0].id];

            var city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
            raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_c_id]);

            expect(railp.get_score(current_player)).toEqual(1 + 1);
            expect(game.active_cards.length).toEqual(0);
        });

        describe("speed record cards", function() {
            var city;
            var track_d_id;
            beforeEach(function() {
                var path = [
                    railf.Hex(2,2),
                    railf.Hex(2,3),
                    railf.Hex(2,4),
                    railf.Hex(1,4)
                ];

                track_d_id = railg.add_track(game, next_player.id, path).id;

                var Cards = root.Cards;
                game.deck = Cards.DeckFactory(
                    Cards.MinorTypes.SPEED_RECORD
                );
                game.active_cards = [game.deck[0].id];

                city = railm.get_city_by_hex(game.map, railf.Hex(4,2));

                railp.increment_engine(current_player);
            });

            it("trigger for deliveries of length >= 3", function() {
                raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_a_id, track_d_id]);
                expect(railp.get_score(current_player)).toEqual(2 + 3);
                expect(railp.get_score(next_player)).toEqual(1);
                expect(game.active_cards.length).toEqual(0);
            });

            it("don't trigger for deliveries of length < 3", function() {
                raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_a_id]);
                expect(railp.get_score(current_player)).toEqual(2);
                expect(game.active_cards.length).toEqual(1);
            });
        });

        describe("hotel cards", function() {
            var deck;
            beforeEach(function() {
                var Cards = root.Cards;
                var city = railm.get_city_by_hex(game.map, railf.Hex(2,2));
                deck = Cards.DeckFactory(
                    Cards.MinorTypes.HOTEL, [city]
                );
                game.deck = deck;
            });

            it("pays hotel owners if they are the current player", function() {
                railp.add_card(current_player, deck[0].id);
                expect(current_player.points).toEqual(0);

                var city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
                raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_a_id]);
                expect(current_player.points).toEqual(2 + 1); // 2 for delivery, 1 for hotel.
            });

            it("pays hotel owners if they are NOT the current player", function() {
                railp.add_card(next_player, deck[0].id);
                expect(next_player.points).toEqual(0);

                var city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
                raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_a_id]);
                expect(current_player.points).toEqual(2);
                expect(next_player.points).toEqual(1);
            });
        });

        describe("service bounty cards", function() {
            var deck;
            beforeEach(function() {
                var Cards = root.Cards;
                var city = railm.get_city_by_hex(game.map, railf.Hex(2,2));
                deck = Cards.DeckFactory(
                    Cards.MinorTypes.SERVICE_BOUNTY, [city, 3]
                );
                game.deck = deck;
                game.active_cards = [deck[0].id];
            });
            
            it("gives points when someone delivers to them", function() {
                expect(current_player.points).toEqual(0);
                var city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
                raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_a_id]);
                expect(current_player.points).toEqual(2 + 3); // 2 for delivery, 3 for bounty.
            });

            it("is removed from the active cards after use", function() {
                var city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
                raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_a_id]);
                expect(root.Util.Array.contains(game.active_cards, deck[0].id)).toEqual(false);
            });
        });

        describe("western link cubes", function() {
            var city;
            var chicago;
            beforeEach(function() {
                city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
                city.cubes[root.Color.colors.RED ] = 1;
                city.western_link = railc.WesternLinkState.BUILT;

                chicago = railm.get_city_by_hex(game.map, railf.Hex(2,2));
                chicago.western_link = railc.WesternLinkState.DEST;
            });

            it("creates new cubes if delivered to Chicago", function() {
                var initial_cubes = railc.num_cubes_remaining(chicago);
                raila.deliver_goods(game, current_player.id, city.id, [track_b_id, track_a_id]);
                expect(railc.num_cubes_remaining(chicago)).toEqual(initial_cubes + 2);
            });
        });
    });

    describe("upgrade_engine", function() {
        var current_player;

        beforeEach(function() {
            current_player = railg.get_current_player(game);
        });

        it("works only for the current player", function() {
            var next_player = railg.get_next_player(game);
            
            expect(function() {
                raila.upgrade_engine(game, next_player.id);
            }).toThrowError(/not this player/);

            expect(function() {
                raila.upgrade_engine(game, current_player.id);
            }).not.toThrow();
        });

        it("ends the current player's turn", function() {
            raila.upgrade_engine(game, current_player.id);
            expect(railg.end_player_turn).toHaveBeenCalledTimes(1);
        });
        
        it("makes the player pay", function() {
            spyOn(railg, "pay");
            spyOn(railg, "cost_for_engine")
            raila.upgrade_engine(game, current_player.id);
            expect(railg.cost_for_engine).toHaveBeenCalledTimes(1);
            expect(railg.pay).toHaveBeenCalledTimes(1);
        });

        it("fails if the player is at max engine size", function() {
            current_player.engine = 8;
            expect(function() {
                raila.upgrade_engine(game, current_player.id);
            }).toThrowError(/max engine/i);
        });

        it("increases the player's engine rating by one", function() {
            expect(railp.get_engine(current_player)).toEqual(1);
            raila.upgrade_engine(game, current_player.id);
            expect(railp.get_engine(current_player)).toEqual(2);
        });

        describe("new engine card", function() {
            beforeEach(function() {
                var Cards = root.Cards;
                game.deck = Cards.DeckFactory(
                    Cards.MinorTypes.NEW_TRAIN
                );
                game.active_cards = [game.deck[0].id];
            });

            it("is not claimed when a player upgrades engine to level 3", function() {
                current_player.engine = 2;
                raila.upgrade_engine(game, current_player.id);
                expect(railp.get_score(current_player)).toEqual(0);
                expect(game.active_cards.length).toEqual(1);
            });

            it("is claimed when a player upgrades their engine to level 4", function() {
                current_player.engine = 3;
                raila.upgrade_engine(game, current_player.id);
                expect(railp.get_score(current_player)).toEqual(4);
                expect(game.active_cards.length).toEqual(0);
            });
        });
    });

    describe("take_action_card", function() {
        var current_player;
        beforeEach(function() {
            current_player = railg.get_current_player(game);
        });

        it("fails when selecting an achievement card", function() {
            var Cards = root.Cards;
            game.deck = Cards.DeckFactory(
                Cards.MinorTypes.SPEED_RECORD
            );
            game.cards_dealt = [game.deck[0].id];
            game.active_cards = [game.deck[0].id];
            expect(function() {
                raila.take_action_card(game, current_player.id, game.deck[0].id);
            }).toThrowError(/take achievements/);
        });

        it("fails when selecting a card not active", function() {
            var Cards = root.Cards;
            game.deck = Cards.DeckFactory(
                Cards.MinorTypes.SPEED_RECORD
            );
            expect(function() {
                raila.take_action_card(game, current_player.id, game.deck[0].id);
            }).toThrowError(/card is not active/);
        });

        it("removes the selected card from the active cards", function() {
            var Cards = root.Cards;
            game.deck = Cards.DeckFactory(
                Cards.MinorTypes.PERFECT_ENG
            );
            game.cards_dealt = [game.deck[0].id];
            game.active_cards = [game.deck[0].id];

            expect(railg.get_active_card_ids(game)).toContain(game.deck[0].id);
            raila.take_action_card(game, current_player.id, game.deck[0].id);
            expect(railg.get_active_card_ids(game)).not.toContain(game.deck[0].id);
        });

        it("ends the player's turn", function() {
            var Cards = root.Cards;
            game.deck = Cards.DeckFactory(
                Cards.MinorTypes.PERFECT_ENG
            );
            game.cards_dealt = [game.deck[0].id];
            game.active_cards = [game.deck[0].id];

            raila.take_action_card(game, current_player.id, game.deck[0].id);
            expect(railg.end_player_turn.calls.count()).toEqual(1);
        });

        describe("new_industry", function() {
            xit("isn't ready");
        });

        describe("city_growth", function() {
            beforeEach(function() {
                var Cards = root.Cards;
                game.deck = Cards.DeckFactory(
                    Cards.MinorTypes.CITY_GROWTH
                );
                game.cards_dealt = [game.deck[0].id];
                game.active_cards = [game.deck[0].id];
            });

            describe("options arg", function() {
                it("must exist", function() {
                    expect(function() {
                        raila.take_action_card(game, current_player.id, game.deck[0].id)
                    }).toThrowError(/missing options/i);
                });

                it("must contain 'city_id'", function() {
                    expect(function() {
                        raila.take_action_card(game, current_player.id, game.deck[0].id, {})
                    }).toThrowError(/missing city_id/i);
                })

                it("city_id must be valid", function() {
                    expect(function() {
                        raila.take_action_card(game, current_player.id, game.deck[0].id, {
                            city_id: 232434
                        })
                    }).toThrowError(/invalid city id/i);
                });
            });
            
            it("adds cubes to the selected city", function() {
                var city = railm.get_city_by_id(game.map, 3);

                expect(railc.num_cubes_remaining(city)).toEqual(1); // precondition

                raila.take_action_card(game, current_player.id, game.deck[0].id, {
                    city_id: 3
                });
                expect(railc.num_cubes_remaining(city)).toEqual(3);
            });

            it("ends the player's turn", function() {
                raila.take_action_card(game, current_player.id, game.deck[0].id, {
                    city_id: 0
                });
                expect(railg.end_player_turn).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe("urbanize", function() {
        var current_player;
        var city;
        var new_color;

        beforeEach(function() {
            current_player = railg.get_current_player(game);
            city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
            new_color = root.Color.colors.BLUE;
        });

        it("works only for the current player", function() {
            var next_player = railg.get_next_player(game);
            
            expect(function() {
                raila.urbanize(game, next_player.id, city.id, new_color);
            }).toThrowError(/not this player/);

            expect(function() {
                raila.urbanize(game, current_player.id, city.id, new_color);
            }).not.toThrow();
        });

        it("ends the current player's turn", function() {
            raila.urbanize(game, current_player.id, city.id, new_color);
            expect(railg.end_player_turn).toHaveBeenCalledTimes(1);
        });
        
        it("makes the player pay", function() {
            spyOn(railg, "pay");
            raila.urbanize(game, current_player.id, city.id, new_color);
            expect(railg.pay).toHaveBeenCalledTimes(1);
        });

        it("fails if the selected color is red", function() {
            expect(function() {
                raila.urbanize(game, current_player.id, city.id, root.Color.colors.RED);
            }).toThrowError(/invalid color/i);
        });

        it("fails if the selected city is not gray", function() {
            var yellow_city = railm.get_city_by_hex(game.map, railf.Hex(0,2));
            expect(function() {
                raila.urbanize(game, current_player.id, yellow_city.id, root.Color.colors.BLUE);
            }).toThrowError(/city color/i);
        });

        it("changes the color of the city", function() {
            raila.urbanize(game, current_player.id, city.id, root.Color.colors.BLUE);
            expect(city.color).toEqual(root.Color.colors.BLUE);
        });

        it("adds two cubes to the city", function() {
            expect(railc.num_cubes_remaining(city)).toEqual(1);
            raila.urbanize(game, current_player.id, city.id, root.Color.colors.BLUE);
            expect(railc.num_cubes_remaining(city)).toEqual(3);
        });
    });

    describe("western_link", function() {
        var current_player;
        var city;

        beforeEach(function() {
            current_player = railg.get_current_player(game);
            city = railm.get_city_by_hex(game.map, railf.Hex(4,2));
            city.western_link = railc.WesternLinkState.POSSIBLE;
        });

        it("works only for the current player", function() {
            var next_player = railg.get_next_player(game);
            
            expect(function() {
                raila.western_link(game, next_player.id, city.id);
            }).toThrowError(/not this player/);

            expect(function() {
                raila.western_link(game, current_player.id, city.id);
            }).not.toThrow();
        });

        it("ends the current player's turn", function() {
            raila.western_link(game, current_player.id, city.id);
            expect(railg.end_player_turn).toHaveBeenCalledTimes(1);
        });
        
        it("makes the player pay", function() {
            spyOn(railg, "pay");
            raila.western_link(game, current_player.id, city.id);
            expect(railg.pay).toHaveBeenCalledTimes(1);
        });

        it("fails if the selected city has no western link option", function() {
            city.western_link = railc.WesternLinkState.NONE;
            expect(function() {
                raila.western_link(game, current_player.id, city.id);
            }).toThrowError(/cannot have/i);
        });

        it("fails if the selected city already has a western link", function() {
            city.western_link = railc.WesternLinkState.BUILT;
            expect(function() {
                raila.western_link(game, current_player.id, city.id);
            }).toThrowError(/already built/i);
        });

        it("adds four red cubes to the city", function() {
            city.cubes[root.Color.colors.RED] = 0;
            raila.western_link(game, current_player.id, city.id);
            expect(city.cubes[root.Color.colors.RED]).toEqual(4);
        });

        it("updates the western link state of the city", function() {
            raila.western_link(game, current_player.id, city.id);
            expect(city.western_link).toEqual(railc.WesternLinkState.BUILT);
        });

        it("awards points for major lines if completed", function() {
            // Add a major line card to the card row.
            var Cards = root.Cards;
            var city0 = railm.get_city_by_hex(game.map, railf.Hex(0,2));
            var city1 = railm.get_city_by_hex(game.map, railf.Hex(4,2));
            game.deck = Cards.DeckFactory(
                Cards.MinorTypes.MAJOR_LINE, [city0, city1, 30, true]
            );
            game.active_cards = [game.deck[0].id];

            // Build part of the major line (so we can complete it as our action).
            railg.add_track(game, current_player.id, [
                railf.Hex(0,2),
                railf.Hex(1,2),
                railf.Hex(2,2),
            ]);
            railg.add_track(game, current_player.id, [
                railf.Hex(2,2),
                railf.Hex(3,2),
                railf.Hex(4,2),
            ]);

            // Check the pre-conditions.
            expect(railp.get_score(current_player)).toEqual(0);
            expect(game.active_cards.length).toEqual(1);

            // Build the western link.
            raila.western_link(game, current_player.id, city.id);
            
            // Expect to get points for the card.
            expect(railp.get_score(current_player)).toEqual(30);

            // Expect the card to be gone from the row.
            expect(game.active_cards.length).toEqual(0);
        });
    });
});
