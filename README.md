# eyebot

Another Twitch bot, written in Typescript.

- [eyebot](#eyebot)
- [Setting up the Bot](#setting-up-the-bot)
  - [Building and Running](#building-and-running)
  - [Credentials](#credentials)
  - [Channels](#channels)
    - [Channel.json](#channeljson)
- [Using the Bot](#using-the-bot)
  - [Common Commands](#common-commands)
    - [Info Commands](#info-commands)
  - [Moderator Commands](#moderator-commands)
  - [Gambling](#gambling)
- [Modifying the Bot](#modifying-the-bot)
  - [Adding new Commands](#adding-new-commands)
  - [Adding new Listeners](#adding-new-listeners)

# Setting up the Bot

## Building and Running

- Create the files listed in creds/.gitignore. For what to put in them,
  see [credentials](#credentials).
- Create (channel).json for each channel the bot should connect to. For what to
  put in them, see [channels](#channels).
- Run `npx tsc` to compile all .ts files in src/ over to .js files in js/.
- Run `npm start` to start the compiled Javascript code in Node.
- `npm run watch` can also be used to run the compiler in watch mode.

## Credentials

There are three files in the [creds](creds) folder that need to be created in order for
the bot to work. A single line of text should be put in each file:

- twitchchannel: The twitch channel you're using to run the bot.
- clientid: The Client ID of your Twitch app.
- oauth: The OAuth key of your Twitch app.

## Channels

To add the bot to a channel, duplicate
[channels/TEMPLATE.json](channels/TEMPLATE.json) and rename the json file to the
twitch channel you want to join (*i.e., to join
[twitchdev](https://www.twitch.tv/twitchdev), rename the file to
twitchdev.json*).

### Channel.json

The contents of a channel.json file are:

- `People`: A dictionary of all the registered people in the channel. This can
  be modified by commands.  
  *The person with the id of `me` is the information of the streamer, and is
  automatically added to the channel's list of people when the bot starts.
  Removing `me` will cause unintended behavior and is not recommended.*
  - `person.id` *(string)*: Same as the key in `People`. **Should not be edited manually.**
  - `person.name` *(string)*: The name of the person.
  - `person.pronouns` *(string)*: The person's pronouns.
- `Gambling`: Information and data for the stream's gambling functionality. See
  [Gambling](#gambling) for how to use the bot to gamble.
  - `Info`: Various properties of the stream's gambling functionality.
    - `pointNameSing` *(string)*: The singular name of the channel's points.
    - `pointNamePlur` *(string)*: The plural name of the channel's points.
    - `gambleMin` *(number)*: The minimum amount of points that can be bet. *Can be removed.*
    - `gambleMax` *(number)*: The maximum amount of points that can be bet. *Can be removed.*
    - `chatReward` *(number)*: The points given for a chat reward.
    - `chatRewardCooldown` *(number)*: Every `chatRewardCooldown` ms, if a user has chat in
      the last `chatRewardCooldown` ms, they are given `chatReward` points.
  - `Multipliers`: A dictionary that defines the multipliers (*all non-integer
    keys will be ignored*). The roll will match to the highest key in the
    dictionary, and give back the points the user bet multiplied by the value
    associated with that key (*i.e., 1 will cause the user's total points to
    remain unchanged, and 0 will remove the bet from the user's total points*).
  - `Users`: A dictionary that stores all users associated with the channel's
    gambling system, and their points. **Should not be edited manually.**
- `InfoCommands`: A dictionary that stores all the Info Commands associated with
  the channel. **Should not be edited manually.**
- `Options`: Various channel-wide options for the bot.
  - `fun` *(boolean)*: Enables various fun commands and listeners.
  - `gambling` *(boolean)*: Enables gambling commands and functionality.
  - `nonModChatDelay` *(number)*: The number of ms that the bot will wait until
    it can respond to a non-mod user's chat message.
  - `commandPrefix` *(string)*: The string that indicates a chat message is a command.

# Using the Bot

- All commands are case-insensitive.
- If the channel has a custom `commandPrefix`, replace `!` in the below commands with
  the prefix.
- Required arguments are `<required>`, and optional arguments are `[optional]`.
- Any command with underscores (`<string_argument>`) can have underscores in
  them to be replaced with spaces. To actually insert an underscore, use `\_` instead.
- Any command with an elipsis (`<argument...>`) takes the rest of the arguments
  and joins them with a single space. Multiple spaces in a row are ignored, so
  they also count as underscore commands (see above).

## Common Commands

*Any user can use these commands at any time.*

- `!commands`: Displays all the commands a user is able to execute.
- `!pronouns`: Displays all joined users' names and pronouns.
- `!topic`: Displays the stream's topic.
- `!<info-command>`: Displays the body of the info command (see [Info Commands](#info-commands)).

### Info Commands

Info Commands are a way to create channel-specific commands.  
Currently, Info Commands just display strings, but in the future there'll be
more complicated formatting and different variables to use.

## Moderator Commands

*Any moderator and the streamer can use these commands at any time.*

- `!ping`: Displays "Pong!".
- `!settopic <topic...>`: Sets the stream's topic.
- `!join <person>`: Adds a person from the channel's list of people with the id
  of person to the stream's list of joined people.
- `!leave <person>`: Removes a person with the id of person from the stream's
  list of joined people.
- `!newperson <person-id> <person_name> <person_pronouns>`: Creates a new person
  and adds it to the channel's list of joined people.
- `!here`: Displays the list of all the ids of the stream's list of joined people.
- `!people`: Displays the list of all the ids of the channel's list of people.
- `!setinfo <info-command> <command_body...>`: Creates a new Info Command (see
  [Info Commands](#info-commands)).

## Gambling

*All functionality in this section will be disabled if the `gambling` option is
set to `false`.*

When a user sends a chat message in a stream's chat, an entry is created for them in
the channel's gambling system. Then, each time a user chats they are given a certain
amount of points (*the details of when and how many points are given are
detailed in the `Gambling.Info` field of the [channel.json file](#channeljson)*).

Then, the user can run various commands to interact with the gambling system:

- `!points`: Displays the amount of points the user has.
- `!top`: Displays the top 10 users in the channel's gambling system with the
  most amount of points.
- `!gamble <amount>`: Takes an amount of points from the user (*can be a `number`, a `percent%`,
  the `min` bet, the `max` bet, or `all` the user's points*), and rolls a random
  number between 1 and 100 inclusive. Then, depending on the multiplier defined
  in the `Gambling.Multipliers` field of the [channel.json file](#channeljson),
  the user is given back their points multiplied by some amount.
- `!givepoints <user_name> <amount>` (*mod only*): Gives a user points.

# Modifying the Bot

## Adding new Commands

To create a new command:

- Create a new `.ts` file anywhere in [src/](src/).
- Add an `import` entry for the new file in [src/commands/commandRegister.ts](src/commands/commandRegisters.ts).
- Set up the command registry:

```TypeScript
  registerCommands(registry =>
    registry
  )
```

- Then, register the command (you can chain them together):
  
```TypeScript
  registerCommands(registry =>
    registry
      .register('commandName', {
        canRun: (bot, com) => true,
        run: (bot, com, body) => {
          return {}
        }
      })
  )
```

The `bot` and `com` parameters are the info for the bot (of type `Bot`) and the
chat message/chatter (of type `ChatInfo`). The `body` parameters are all the
space-separated words after the command.

`canRun` is the function that returns a `boolean` depending on whether or not
the command can be run based on the properties of the bot and chat
message/chatter. This is used for both testing if a command should be run and
whether or not a command should be listed in the output of `!commands`.

`run` is what is executed when the command is ran. It returns a `CommandResult`
object which is used to transform information in the bot. This means **you
should not modify the bot, stream, or channel directly** as this program was
designed to use as much immutable data as possible.

You can also add aliases (these are chainable too):

```TypeScript
registerCommands(registry =>
    registry
      .registerAlias('aliasCommand',
            ([key, body]) => [
                'outputCommand',
                ['outputBody']
            ])
  )
```

Now, if `!aliasCommand` is run, `!outputCommand outputBody` will be ran instead.

The alias function can be used to transform the command input in any way you
like. If `!aliasCommand abc 123` is ran, then `key` would be `aliasCommand` and
`body` would be `[abc, 123]`.

## Adding new Listeners

To create a new listener:

- Create a new `.ts` file anywhere in [src/](src/).
- Add an `import` entry for the new file in [src/listeners/messageListeners.ts](src/listeners/messageListeners.ts).
- Set up the listener registry:

```TypeScript
  registerListener(
    MessageListener.When()
  )
```

- Then, add various listeners:

```TypeScript
  registerListener(
    MessageListener.When()
      .is('value', (bot, chatInfo) => {})
      .contains('value', (bot, chatInfo) => {})
      .matches(/pattern/, (bot, chatInfo) => {})
  )
```

- `is` fires if the message equals the `value`.
- `contains` fires if the message contains the `value`.
- `matches` fires if the message matches the `pattern`.
