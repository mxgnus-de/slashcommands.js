import {
   ApplicationCommandOptionChoiceData,
   ApplicationCommandOptionData,
   ApplicationCommandOptionType,
   ChannelType,
   Client,
   PermissionResolvable,
} from 'discord.js';
import { EventEmitter } from 'events';
import colors from 'colors';
import { LocalizationMap } from 'discord-api-types/payloads/common';

interface Options {
   debug?: boolean;
   guildId?: string;
}

let that: Client;
let emitter: EventEmitter = new EventEmitter();
const options: Options = {
   debug: false,
   guildId: undefined,
};

type SlashcommandOptionTypeString =
   | 'Subcommand'
   | 'SubcommandGroup'
   | 'String'
   | 'Integer'
   | 'Boolean'
   | 'User'
   | 'Channel'
   | 'Role'
   | 'Mentionable'
   | 'Number'
   | 'Attachment';

type SlashcommandOptionType =
   | SlashcommandOptionTypeString
   | ApplicationCommandOptionType;

type SlashcommandChannelType = ChannelType;

class Slash {
   public client: Client;

   public GuildSlashCommand = GuildSlashCommand;
   public fetchGuildSlashcommands = fetchGuildSlashcommands;
   public deleteGuildSlashcommand = deleteGuildSlashcommand;
   public deleteAllGuildSlashcommands = deleteAllGuildSlashcommands;
   public Slashcommand = Slashcommand;
   public fetchSlashcommands = fetchSlashcommands;
   public fetchSlashcommandById = fetchSlashcommandById;
   public fetchSlashcommandByName = fetchSlashcommandByName;
   public deleteSlashcommand = deleteSlashcommand;
   public deleteAllSlashcommands = deleteAllSlashcommands;

   /**
    * Initializes the Slash class.
    * @param {Client} client - Discord.Client - The discord client.
    * @param {Options} clientOptions - Options = {}
    * @returns The class instance.
    */
   constructor(client: Client, clientOptions: Options = {}) {
      this.client = client;
      that = client;

      if (clientOptions.debug) options.debug = clientOptions.debug;
      if (clientOptions.guildId) {
         validateGuildId(clientOptions.guildId);
         options.guildId = clientOptions.guildId;
      }
      debugLogger(`Slash initialized.`);

      if (!isReady()) {
         client.on('ready', () => {
            emitter.emit('ready');
         });
      }
      return this;
   }
}

class GuildSlashCommand {
   protected name: string | null = null;
   protected description: string | null = null;
   protected options: ApplicationCommandOptionData[] = [];
   protected guildId: string | null = null;
   protected type: string | null = null;
   protected dmPermission: boolean | null = null;
   protected nameLocalizations: LocalizationMap | null = null;
   protected descriptionLocalizations: LocalizationMap | null = null;
   protected defaultMemberPermissions: PermissionResolvable | null = null;

   /**
    * Creates a new guild slash command.
    * @returns The class instance.
    */
   constructor() {
      if (!isInit()) {
         throw new Error('Slash command not initialized');
      }
      if (options.guildId) this.guildId = options.guildId;
      return this;
   }

   /**
    * This function sets the guildId property of the class instance to the value of the guildId
    * parameter, and returns the class instance.
    * @param {string} guildId - The ID of the guild.
    * @returns The instance of the class.
    */
   public setGuildId(guildId: string) {
      validateGuildId(guildId);
      this.guildId = guildId;
      return this;
   }

   /**
    * This function takes a string, validates it, and then sets the name property of the object to the
    * lowercase version of the string.
    * @param {string} name - The name of the slash command.
    * @returns The instance of the class.
    */
   public setName(name: string) {
      validateName(name);
      this.name = name.toLowerCase();
      return this;
   }

   /**
    * The setDescription function takes a string as an argument, validates it, and then sets the
    * description property of the object to the value of the argument.
    * @param {string} description - The description of the slash command.
    * @returns The instance of the class.
    */
   public setDescription(description: string) {
      validateDescription(description);
      this.description = description;
      return this;
   }

   /**
    * This function takes an array of objects and checks if the objects have a name, type and
    * description property. If they don't, it throws an error.
    * @param {ApplicationCommandOptionData[]} options - ApplicationCommandOptionData[]
    * @returns The instance of the class.
    */
   public setOptions(
      options: (ApplicationCommandOptionData | SlashcommandOption)[],
   ) {
      if (!validateOptions(this.options)) {
         throw new Error(
            'Invalid options, slashcommand option must have a name, type and description',
         );
      }
      this.options = formatOptions(options);
      return this;
   }

   /**
    * This function adds an option to the command
    * @param {ApplicationCommandOptionData} option - ApplicationCommandOptionData
    * @returns The ApplicationCommandData object.
    */
   public addOption(option: ApplicationCommandOptionData | SlashcommandOption) {
      this.options.push(formatOptions([option])[0]);
      return this;
   }

   /**
    * This function sets the dmPermission property to the value of the dmPermission parameter, and if
    * the type of the dmPermission parameter is not a boolean, it throws an error.
    * @param {boolean} dmPermission - boolean - Whether or not slashcommand can be used in DMs.
    * @returns The class instance.
    */
   public setDmPermission(dmPermission: boolean) {
      this.dmPermission = dmPermission;

      if (typeof this.dmPermission !== 'boolean') {
         throw new Error('DM permission must be a boolean');
      }

      return this;
   }

   /**
    * This function sets the nameLocalizations property of the object to the value of the
    * nameLocalizations parameter.
    * @param {LocalizationMap} nameLocalizations - LocalizationMap
    * @returns The class instance.
    */
   public setNameLocalizations(nameLocalizations: LocalizationMap) {
      this.nameLocalizations = nameLocalizations;
      return this;
   }

   /**
    * This function sets the descriptionLocalizations property of the object to the value of the
    * descriptionLocalizations parameter.
    * @param {LocalizationMap} descriptionLocalizations - LocalizationMap
    * @returns The object itself.
    */
   public setDescriptionLocalizations(
      descriptionLocalizations: LocalizationMap,
   ) {
      this.descriptionLocalizations = descriptionLocalizations;
      return this;
   }

   /**
    * This function sets the default member permissions for the slash command.
    * @param {PermissionResolvable} defaultMemberPermissions - PermissionResolvable
    * @returns The instance of the class.
    */
   public setDefaultMemberPermissions(
      defaultMemberPermissions: PermissionResolvable,
   ) {
      this.defaultMemberPermissions = defaultMemberPermissions;
      return this;
   }

   /**
    * This function creates a slash command in a guild, and returns the slash command object.
    * @returns The slashcommand object.
    */
   public async register() {
      if (!this.name) {
         throw new Error('Name is not set');
      }
      if (!this.description) {
         throw new Error('Description is not set');
      }
      if (!this.guildId) {
         throw new Error('Guild ID is not set');
      }
      if (!validateOptions(this.options)) {
         throw new Error(
            'Invalid options, slashcommand option must have a name, type and description',
         );
      }

      if (!isReady()) {
         await waitForReady();
      }

      const guild =
         that.guilds.cache.get(this.guildId) ||
         (await that.guilds.fetch(this.guildId));
      if (!guild) {
         throw new Error('Guild not found');
      }

      let err = null;
      debugLogger(
         `Registering slash command ${this.name} in guild ${guild.id}`,
      );
      const slashcommand = await guild.commands
         .create({
            name: this.name,
            description: this.description,
            options: this.options,
            dmPermission: this.dmPermission ?? undefined,
            nameLocalizations: this.nameLocalizations ?? undefined,
            descriptionLocalizations:
               this.descriptionLocalizations ?? undefined,
            defaultMemberPermissions:
               this.defaultMemberPermissions ?? undefined,
         })
         .catch((e) => {
            err = e;
            throw e;
         });

      if (err !== null || !slashcommand) {
      }

      return slashcommand;
   }
}

class Slashcommand {
   protected name: string | null = null;
   protected description: string | null = null;
   protected options: ApplicationCommandOptionData[] = [];
   protected dmPermission: boolean | null = null;
   protected nameLocalizations: LocalizationMap | null = null;
   protected descriptionLocalizations: LocalizationMap | null = null;
   protected defaultMemberPermissions: PermissionResolvable | null = null;

   /**
    * Create a new slashcommand.
    * @returns The instance of the class.
    */
   constructor() {
      if (!isInit()) {
         throw new Error('Slash command not initialized');
      }
      return this;
   }

   /**
    * This function takes a string, validates it, and then sets the name property of the object to the
    * lowercase version of the string.
    * @param {string} name - The name of the new slash command.
    * @returns The instance of the class.
    */
   public setName(name: string) {
      validateName(name);
      this.name = name.toLowerCase();
      return this;
   }

   /**
    * The function takes a string as an argument, validates it, and then sets the description property
    * of the object to the value of the argument
    * @param {string} description - The description of the slashcommand.
    * @returns The instance of the class.
    */
   public setDescription(description: string) {
      validateDescription(description);
      this.description = description;
      return this;
   }

   /**
    * This function takes an array of objects and checks if the objects have a name, type and
    * description property. If they don't, it throws an error.
    * @param {ApplicationCommandOptionData[]} options - ApplicationCommandOptionData[]
    * @returns The instance of the class.
    */
   public setOptions(
      options: (ApplicationCommandOptionData | SlashcommandOption)[],
   ) {
      if (!validateOptions(this.options)) {
         throw new Error(
            'Invalid options, slashcommand option must have a name, type and description',
         );
      }
      this.options = formatOptions(options);
      return this;
   }

   /**
    * This function adds an option to the command
    * @param {ApplicationCommandOptionData} option - ApplicationCommandOptionData
    * @returns The ApplicationCommandData object.
    */
   public addOption(option: ApplicationCommandOptionData | SlashcommandOption) {
      this.options.push(formatOptions([option])[0]);
      return this;
   }

   /**
    * This function sets the dmPermission property to the value of the dmPermission parameter, and if
    * the type of the dmPermission parameter is not a boolean, it throws an error.
    * @param {boolean} dmPermission - boolean - Whether or not slashcommand can be used in DMs.
    * @returns The class instance.
    */
   public setDmPermission(dmPermission: boolean) {
      this.dmPermission = dmPermission;

      if (typeof this.dmPermission !== 'boolean') {
         throw new Error('DM permission must be a boolean');
      }

      return this;
   }

   /**
    * This function sets the nameLocalizations property of the object to the value of the
    * nameLocalizations parameter.
    * @param {LocalizationMap} nameLocalizations - LocalizationMap
    * @returns The instance of the class.
    */
   public setNameLocalizations(nameLocalizations: LocalizationMap) {
      this.nameLocalizations = nameLocalizations;
      return this;
   }

   /**
    * This function sets the descriptionLocalizations property of the object to the value of the
    * descriptionLocalizations parameter.
    * @param {LocalizationMap} descriptionLocalizations - LocalizationMap
    * @returns The instance of the class.
    */
   public setDescriptionLocalizations(
      descriptionLocalizations: LocalizationMap,
   ) {
      this.descriptionLocalizations = descriptionLocalizations;
      return this;
   }

   /**
    * This function sets the default member permissions for the slash command.
    * @param {PermissionResolvable} defaultMemberPermissions - PermissionResolvable
    * @returns The instance of the class.
    */
   public setDefaultMemberPermissions(
      defaultMemberPermissions: PermissionResolvable,
   ) {
      this.defaultMemberPermissions = defaultMemberPermissions;
      return this;
   }

   /**
    * Creates the slash command.
    * @returns The slashcommand object.
    */
   public async register() {
      if (!this.name) {
         throw new Error('Name is not set');
      }
      if (!this.description) {
         throw new Error('Description is not set');
      }
      if (!validateOptions(this.options)) {
         throw new Error(
            'Invalid options, slashcommand option must have a name, type and description',
         );
      }

      if (!isReady()) {
         await waitForReady();
      }

      if (!that.application) {
         throw new Error('Application in client not found');
      }

      debugLogger(
         `Registering slash command ${this.name} in application ${
            that.application.name ? that.application.name : 'unknown'
         } (${that.application.id})`,
      );
      let err = false;
      const slashcommand = await that.application.commands
         .create({
            name: this.name,
            description: this.description,
            options: this.options,
            dmPermission: this.dmPermission ?? undefined,
            nameLocalizations: this.nameLocalizations ?? undefined,
            descriptionLocalizations:
               this.descriptionLocalizations ?? undefined,
            defaultMemberPermissions:
               this.defaultMemberPermissions ?? undefined,
         })
         .catch((e) => {
            err = true;
            throw e;
         });

      if (!slashcommand || err) return;

      return slashcommand;
   }
}

class SlashCommandOptionChoice {
   public name: string | number | boolean | null = null;
   public value: string | number | boolean | null = null;
   public nameLocalizations: LocalizationMap | null = null;

   /**
    * Create a new slash command option choice.
    * @returns The object that is being created.
    */
   constructor() {
      return this;
   }

   /**
    * The setName function takes a string, number, or boolean as an argument and sets the name property
    * of the Choice object to the value of the argument.
    * @param {string | number | boolean} name - The name of the choice.
    * @returns The instance of the class.
    */
   public setName(name: string | number | boolean) {
      validateChoiceName(name);
      this.name = name;
      return this;
   }

   /**
    * This function sets the value of the choice to the value passed in, and returns the choice.
    * @param {string | number | boolean} value - string | number | boolean
    * @returns The value of the property "value"
    */
   public setValue(value: string | number | boolean) {
      validateChoiceValue(value);
      this.value = value;
      return this;
   }

   /**
    * This function sets the nameLocalizations property of the object to the value of the
    * nameLocalizations parameter.
    * @param {LocalizationMap} nameLocalizations - LocalizationMap
    * @returns The object itself.
    */
   public setNameLocalizations(nameLocalizations: LocalizationMap) {
      this.nameLocalizations = nameLocalizations;
      return this;
   }
}

class SlashcommandOption {
   public name: string | null = null;
   public description: string | null = null;
   public type: ApplicationCommandOptionType | null = null;
   public required: boolean = false;
   public autocomplete: boolean = false;
   public channelTypes?: SlashcommandChannelType[];
   public maxValue?: number;
   public minValue?: number;
   public choices?: SlashCommandOptionChoice[];
   public nameLocalizations: LocalizationMap | null = null;
   public descriptionLocalizations: LocalizationMap | null = null;
   public options: ApplicationCommandOptionData[] | null = null;

   /**
    * Creates a new SlashcommandOption object.
    * @returns The object that is being created.
    */
   constructor() {
      return this;
   }

   /**
    * This function takes a string, validates it, and then sets the name property of the object to the
    * lowercase version of the string.
    * @param {string} name - The name of the new user.
    * @returns The instance of the class.
    */
   public setName(name: string) {
      validateName(name);
      this.name = name.toLowerCase();
      return this;
   }

   /**
    * The function takes a string as an argument, validates it, and then sets the description property
    * of the object to the value of the argument
    * @param {string} description - The description of the task.
    * @returns The instance of the class.
    */
   public setDescription(description: string) {
      validateDescription(description);
      this.description = description;
      return this;
   }

   /**
    * This function sets the type of the option to the type passed in as a parameter and returns the
    * option.
    * @param {SlashcommandOptionType} type - The type of option.
    * @returns The object itself.
    */
   public setType(type: SlashcommandOptionType) {
      if (typeof type === 'string') {
         const formattedType = (type.charAt(0).toUpperCase() +
            type.slice(1).toLowerCase()) as SlashcommandOptionTypeString;

         const applicationCommandType =
            ApplicationCommandOptionType[formattedType];

         if (!applicationCommandType) {
            throw new Error(`Unknown slashcommand option type ${type}`);
         }

         this.type = applicationCommandType;
      } else {
         this.type = type;
      }

      return this;
   }

   /**
    * This function sets the required property of the class to the value passed in.
    * @param {boolean} required - boolean
    * @returns The instance of the class.
    */
   public setRequired(required: boolean) {
      if (typeof required !== 'boolean') {
         throw new Error('Required must be a boolean');
      }
      this.required = required;
      return this;
   }

   /**
    * This function sets the autocomplete property of the class to the value passed in as a parameter.
    * @param {boolean} autocomplete - boolean
    * @returns The object itself.
    */
   public setAutocomplete(autocomplete: boolean) {
      this.autocomplete = autocomplete;
      return this;
   }

   /**
    * This function sets the allowed channel types for the slash command.
    * @param {SlashcommandChannelType[]} channelTypes - SlashcommandChannelType[]
    * @returns The object itself.
    */
   public setChannelTypes(channelTypes: SlashcommandChannelType[]) {
      this.channelTypes = channelTypes;
      return this;
   }

   /**
    * This function sets the maxValues property of the object to the value passed in as a parameter and
    * returns the object.
    * @param {number} maxValues - The maximum number of values to return.
    * @returns The object itself.
    */
   public setMaxValues(maxValues: number) {
      this.maxValue = maxValues;
      return this;
   }

   /**
    * This function sets the minValue property of the object to the value passed in as a parameter and
    * returns the object.
    * @param {number} minValue - The minimum value of the range.
    * @returns The object itself.
    */
   public setMinValue(minValue: number) {
      this.minValue = minValue;
      return this;
   }
   /**
    * This function sets the choices for the slash command
    * @param {SlashCommandOptionChoice[]} choices - An array of SlashCommandOptionChoice objects.
    * @returns The object itself.
    */

   public setChoices(choices: SlashCommandOptionChoice[]) {
      this.choices = choices;
      return this;
   }

   /**
    * This function sets the nameLocalizations property of the object to the value of the
    * nameLocalizations parameter.
    * @param {LocalizationMap} nameLocalizations - LocalizationMap
    * @returns The instance of the class.
    */
   public setNameLocalizations(nameLocalizations: LocalizationMap) {
      this.nameLocalizations = nameLocalizations;
      return this;
   }

   /**
    * This function sets the descriptionLocalizations property of the object to the value of the
    * descriptionLocalizations parameter.
    * @param {LocalizationMap} descriptionLocalizations - LocalizationMap
    * @returns The instance of the class.
    */
   public setDescriptionLocalizations(
      descriptionLocalizations: LocalizationMap,
   ) {
      this.descriptionLocalizations = descriptionLocalizations;
      return this;
   }

   /**
    * It takes an array of objects
    * @param {(ApplicationCommandOptionData| SlashcommandOption)[]} options -
    * (ApplicationCommandOptionData| SlashcommandOption)[]
    * @returns The object itself.
    */
   public setOptions(
      options: (ApplicationCommandOptionData | SlashcommandOption)[],
   ) {
      this.options = formatOptions(options);
      return this;
   }

   /**
    * This function adds an option to the option
    * @param {ApplicationCommandOptionData | SlashcommandOption} option - ApplicationCommandOptionData
    * | SlashcommandOption
    * @returns The object itself.
    */
   public addOption(option: ApplicationCommandOptionData | SlashcommandOption) {
      if (!this.options) {
         this.options = [];
      }
      this.options.push(formatOptions([option])[0]);
      return this;
   }
}

async function fetchGuildSlashcommands(
   { guildId }: { guildId: string } = {
      guildId: '',
   },
) {
   if (!isInit()) {
      throw new Error('Slash command not initialized');
   }
   if (options.guildId) guildId = options.guildId;
   if (!guildId) {
      throw new Error('Guild ID is not set');
   }
   validateGuildId(guildId);

   if (!isReady()) {
      await waitForReady();
   }

   debugLogger(`Fetching slash commands for guild ${guildId}`);
   let err = false;
   const guild =
      that.guilds.cache.get(guildId) || (await that.guilds.fetch(guildId));
   if (!guild) {
      throw new Error('Guild not found');
   }

   const slashcommands = await guild.commands.fetch().catch((e) => {
      err = true;
      throw e;
   });

   if (err || !slashcommands) return;

   return slashcommands;
}

async function fetchSlashcommandById({
   id,
   guildId,
}: {
   id: string;
   guildId?: string;
}) {
   if (!isInit()) {
      throw new Error('Slash command not initialized');
   } else if (!isReady()) {
      await waitForReady();
   } else if (!id) {
      throw new Error('Id is not set');
   }

   if (!that.application) {
      throw new Error('Application in client not found');
   }

   debugLogger(`Fetching slash command ${id}`);
   let err = false;
   const slashcommand = await that.application.commands
      .fetch(id, {
         guildId,
      })
      .catch((e) => {
         err = true;
         throw e;
      });

   if (err || !slashcommand) return;

   return slashcommand;
}

async function fetchSlashcommands() {
   if (!isInit()) {
      throw new Error('Slash command not initialized');
   }

   if (!isReady()) {
      await waitForReady();
   }

   if (!that.application) {
      throw new Error('Application in client not found');
   }

   debugLogger(
      `Fetching slash commands for application ${that.application.name} (${that.application.id})`,
   );
   let err = false;
   const slashcommands = await that.application.commands.fetch().catch((e) => {
      err = true;
      throw e;
   });

   if (err || !slashcommands) return;

   return slashcommands;
}

async function fetchSlashcommandByName({
   name,
   guildId,
}: {
   name: string;
   guildId?: string;
}) {
   if (!isInit()) {
      throw new Error('Slash command not initialized');
   } else if (!isReady()) {
      await waitForReady();
   } else if (!name) {
      throw new Error('Name is not set');
   }

   if (!that.application) {
      throw new Error('Application in client not found');
   }

   debugLogger(`Fetching slash command ${name}`);
   let err = false;

   if (guildId) {
      const guildCommands = await fetchGuildSlashcommands({ guildId });

      if (!guildCommands?.size) {
         return null;
      }

      const slashcommand = guildCommands.find(
         (command) => command.name === name,
      );

      return slashcommand || null;
   } else {
      const slashcommands = await fetchSlashcommands();

      if (!slashcommands?.size) {
         return null;
      }

      const slashcommand = slashcommands.find(
         (command) => command.name === name,
      );

      return slashcommand || null;
   }
}

async function deleteGuildSlashcommand(
   {
      guildId,
      name,
      id,
   }: {
      guildId: string;
      name?: string;
      id?: string;
   } = {
      guildId: '',
   },
) {
   if (!isInit()) {
      throw new Error('Slash command not initialized');
   }
   if (options.guildId) guildId = options.guildId;
   if (!guildId) {
      throw new Error('Guild ID is not set');
   }
   validateGuildId(guildId);

   if (!name && !id) {
      throw new Error('Name or ID is not set. Please specify one');
   }

   if (!isReady()) {
      await waitForReady();
   }

   let cmdId = id;
   if (!id && name) {
      const slashcommands = await fetchGuildSlashcommands({ guildId });
      if (!slashcommands) throw new Error('Invalid slashcommand id');
      const slashcommand = slashcommands.find((c) => c.name === name);
      if (!slashcommand) throw new Error('Invalid slashcommand name');
      cmdId = slashcommand.id;
   }

   if (!cmdId) throw new Error('Invalid slashcommand id');

   debugLogger(`Deleting slash command ${cmdId} for guild ${guildId}`);
   let err = false;
   const guild =
      that.guilds.cache.get(guildId) || (await that.guilds.fetch(guildId));
   if (!guild) {
      throw new Error('Guild not found');
   }

   const slashcommand = await guild.commands.delete(cmdId).catch((e) => {
      err = true;
      throw e;
   });

   if (err || !slashcommand) return;

   return slashcommand;
}

async function deleteSlashcommand({
   name,
   id,
}: { name?: string; id?: string } = {}) {
   if (!isInit()) {
      throw new Error('Slash command not initialized');
   }

   if (!name && !id) {
      throw new Error('Name or ID is not set. Please specify one');
   }

   if (!isReady()) {
      await waitForReady();
   }

   if (!that.application) {
      throw new Error('Application in client not found');
   }

   let cmdId = id;

   if (!id && name) {
      const slashcommands = await fetchSlashcommands();
      if (!slashcommands) throw new Error('Invalid slashcommand id');
      const slashcommand = slashcommands.find((c) => c.name === name);
      if (!slashcommand) throw new Error('Invalid slashcommand name');
      cmdId = slashcommand.id;
   }

   if (!cmdId) throw new Error('Invalid slashcommand id');

   debugLogger(
      `Deleting slash command ${cmdId} for application ${that.application.name} (${that.application.id})`,
   );
   let err = false;
   const slashcommand = await that.application.commands
      .delete(cmdId)
      .catch((e) => {
         err = true;
         throw e;
      });

   if (err || !slashcommand) return;

   return slashcommand;
}

async function deleteAllGuildSlashcommands(
   {
      guildId,
   }: {
      guildId: string;
   } = {
      guildId: '',
   },
) {
   if (!isInit()) {
      throw new Error('Slash command not initialized');
   }
   if (options.guildId) guildId = options.guildId;
   if (!guildId) {
      throw new Error('Guild ID is not set');
   }
   validateGuildId(guildId);

   if (!isReady()) {
      await waitForReady();
   }

   debugLogger(`Deleting all slash commands for guild ${guildId}`);
   let err = false;
   const guild =
      that.guilds.cache.get(guildId) || (await that.guilds.fetch(guildId));
   if (!guild) {
      throw new Error('Guild not found');
   }

   const slashcommands = await guild.commands.fetch().catch((e) => {
      err = true;
      throw e;
   });

   if (err || !slashcommands) return;

   const deleted = await Promise.all(
      slashcommands.map((c) => guild.commands.delete(c.id)),
   );

   return deleted;
}

async function deleteAllSlashcommands() {
   if (!isInit()) {
      throw new Error('Slash command not initialized');
   }

   if (!isReady()) {
      await waitForReady();
   }

   if (!that.application) {
      throw new Error('Application in client not found');
   }

   debugLogger(
      `Deleting all slash commands for application ${that.application.name} (${that.application.id})`,
   );
   let err = false;
   const slashcommands = await that.application.commands.fetch().catch((e) => {
      err = true;
      throw e;
   });

   if (err || !slashcommands) return;

   const deleted = await Promise.all(
      slashcommands.map((c) => {
         if (!that.application) return;
         that.application.commands.delete(c.id);
      }),
   );

   return deleted;
}

function validateOptions(options: ApplicationCommandOptionData[]): boolean {
   return options.every((option) => {
      return option.name && option.description && option.type;
   });
}

function isInit(): boolean {
   return !!that;
}

function validateGuildId(guildId: string) {
   if (typeof guildId !== 'string') throw new Error('GuildId must be a string');
   if (!/^[0-9]{17,19}$/.test(guildId)) {
      throw new Error('Invalid guild ID');
   }
}

function validateName(name: string) {
   if (typeof name !== 'string') throw new Error('Name must be a string');
   if (name.length > 32)
      throw new Error('Name has to be less than 32 characters');
   if (name.length < 1)
      throw new Error('Name has to be more than 1 characters');
   if (name.match(/[^a-zA-Z0-9_]/g))
      throw new Error('Name can only contain letters, numbers and underscores');
   return;
}

function validateDescription(description: string) {
   if (typeof description !== 'string')
      throw new Error('Description must be a string');
   if (description.length > 100)
      throw new Error('Description has to be less than 100 characters');
   if (description.length < 1)
      throw new Error('Description has to be more than 1 characters');
   return;
}

function formatOptions(
   options: (ApplicationCommandOptionData | SlashcommandOption)[],
): ApplicationCommandOptionData[] {
   const optionsArray: ApplicationCommandOptionData[] = [];

   for (const option of options) {
      if (option instanceof SlashcommandOption) {
         if (
            typeof option.name !== 'string' ||
            typeof option.description !== 'string' ||
            typeof option.type !== 'number'
         ) {
            throw new Error('Invalid option ' + JSON.stringify(option));
         }

         if (
            option.type === ApplicationCommandOptionType.Subcommand ||
            option.type === ApplicationCommandOptionType.SubcommandGroup
         ) {
            throw new Error(
               'Subcommand and subcommand group are not supported yet',
            );
         } else if (
            option.type === ApplicationCommandOptionType.Integer ||
            option.type === ApplicationCommandOptionType.Number
         ) {
            if (
               option.choices &&
               !option.choices.every((c) => typeof c.value === 'number')
            ) {
               throw new Error(
                  'Invalid choices, choice value must be a number! For option ' +
                     JSON.stringify(option),
               );
            }

            optionsArray.push({
               name: option.name,
               description: option.description,
               type: option.type,
               minValue: option.minValue,
               maxValue: option.maxValue,
               autocomplete: option.choices?.length
                  ? false
                  : option.autocomplete,
               choices:
                  (option.choices as ApplicationCommandOptionChoiceData<number>[]) ||
                  undefined,
               nameLocalizations: option.nameLocalizations || undefined,
               descriptionLocalizations:
                  option.descriptionLocalizations || undefined,
               required: option.required,
            });
         } else if (option.type === ApplicationCommandOptionType.String) {
            if (
               option.choices &&
               !option.choices.every((c) => typeof c.value === 'string')
            ) {
               throw new Error(
                  'Invalid choices, choice value must be a string! For option ' +
                     JSON.stringify(option),
               );
            }

            optionsArray.push({
               name: option.name,
               description: option.description,
               type: option.type,
               nameLocalizations: option.nameLocalizations || undefined,
               descriptionLocalizations:
                  option.descriptionLocalizations || undefined,
               required: option.required,
               maxLength: option.maxValue,
               minLength: option.minValue,
               autocomplete: option.choices?.length
                  ? false
                  : option.autocomplete,
               choices:
                  (option.choices as ApplicationCommandOptionChoiceData<string>[]) ||
                  undefined,
            });
         } else if (option.type === ApplicationCommandOptionType.Boolean) {
            optionsArray.push({
               name: option.name,
               description: option.description,
               channelTypes: option.channelTypes || undefined,
               descriptionLocalizations:
                  option.descriptionLocalizations || undefined,
               nameLocalizations: option.nameLocalizations || undefined,
               type: option.type,
               required: option.required,
            });
         } else {
            optionsArray.push({
               name: option.name,
               description: option.description,
               channelTypes: option.channelTypes || undefined,
               descriptionLocalizations:
                  option.descriptionLocalizations || undefined,
               nameLocalizations: option.nameLocalizations || undefined,
               type: option.type,
               required: option.required,
            });
         }
      } else {
         optionsArray.push(option);
      }
   }

   return optionsArray;
}

function isReady(): boolean {
   return that.readyAt instanceof Date;
}

function debugLogger(message: string) {
   if (options.debug) {
      const date = new Date();
      const time = `${date.getDay().toString().padStart(2, '0')}.${
         date.getMonth() + 1
      }.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
      console.debug(
         colors.grey(
            '[' +
               colors.blue('DEBUG') +
               ' | ' +
               colors.blue(time) +
               '] => ' +
               colors.cyan(message),
         ),
      );
   }
}

function validateChoiceName(name: string | number | boolean) {
   if (typeof name !== 'string') throw new Error('Name must be a string');
   if (name.length > 100)
      throw new Error('Choice name has to be less than 100 characters');
   if (name.length < 1)
      throw new Error('Choice name has to be more than 1 characters');
   return;
}

function validateChoiceValue(value: string | number | boolean) {
   if (value.toString().length > 100)
      throw new Error('Choice value has to be less than 100 characters');
   if (value.toString().length < 1)
      throw new Error('Choice value has to be more than 1 characters');
   return;
}

async function waitForReady() {
   if (!isReady()) {
      await new Promise((resolve) => {
         const interval = setInterval(() => {
            if (isReady()) {
               clearInterval(interval);
               resolve(null);
            }
         }, 500);
      });
   } else {
      return;
   }
}

export {
   Slash,
   Slashcommand,
   SlashcommandOption,
   SlashCommandOptionChoice,
   GuildSlashCommand,
   fetchGuildSlashcommands,
   fetchSlashcommands,
   fetchSlashcommandById,
   fetchSlashcommandByName,
   deleteGuildSlashcommand,
   deleteSlashcommand,
   deleteAllGuildSlashcommands,
   deleteAllSlashcommands,
};
