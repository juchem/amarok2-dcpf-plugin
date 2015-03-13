/*
    Delete Current Playing File plugin for Amarok 2
    Copyright (C) 2011 Marcelo Juchem

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*/

Importer.loadQtBinding("qt.core");
Importer.loadQtBinding("qt.gui");

var g_dcpfStrings = new Object();

var g_dcpfPlugin = new function() {

	// Delete Current Playing File

	this.deleteCurrentPlayingFile = function() {
		try
		{
			if(Amarok.Playlist.activeIndex() < 0 || Amarok.Playlist.totalTrackCount() < 1)
			{
				return;
			}

			Amarok.Engine.Pause();

			var activeIndex = Amarok.Playlist.activeIndex();

			if(activeIndex < 0 || Amarok.Playlist.filenames().length < 1)
			{
				return;
			}

			var file = new QFile(Amarok.Playlist.filenames()[activeIndex]);

			if(!file.exists())
			{
				Amarok.alert(g_dcpfStrings.LANG_REMOVED_NOTFOUND, "information");

				Amarok.Engine.Play();

				return;
			}

			if(this.m_askDeleteConfirmation && Amarok.alert(g_dcpfStrings.LANG_DELETE_CONFIRMATION(file.fileName()), "warningContinueCancel") != 5)
			{
				Amarok.Engine.Play();

				return;
			}

			var trackPosition = -1;

			try
			{
				trackPosition = Amarok.Engine.trackPositionMs();
			}
			catch(e)
			{
				try
				{
					trackPosition = Amarok.Engine.trackPosition() * 1000;
				}
				catch(e2)
				{
				}
			}

			Amarok.Engine.Stop(true);

			if(!file.remove())
			{
				if(file.exists())
				{
					Amarok.alert(g_dcpfStrings.LANG_CANNOT_DELETE(file.fileName()), "error");

					Amarok.Playlist.playByIndex(activeIndex);

					if(trackPosition > 0)
					{
						Amarok.Engine.Seek(trackPosition);
					}
				}

				return;
			}

			for(var i = Amarok.Playlist.filenames().length; i--; )
			{
				if(Amarok.Playlist.filenames()[i] == file.fileName())
				{
					Amarok.Playlist.removeByIndex(i);

					if(i <= activeIndex)
					{
						--activeIndex;
					}
				}
			}

			if(activeIndex >= 0 && activeIndex < Amarok.Playlist.filenames().length)
			{
				Amarok.Playlist.playByIndex(activeIndex);
			}
			else if(Amarok.Playlist.filenames().length > 0)
			{
				Amarok.Playlist.playByIndex(Amarok.Playlist.filenames().length - 1);
			}
		}
		catch(e)
		{
			Amarok.alert(e ? e : g_dcpfStrings.LANG_UNKNOWN_ERROR, "error");
		}
	};

	// Settings

	this.saveBool = function(name, value) {
		Amarok.Script.writeConfig(name, value ? "true" : "false");
	};

	this.loadBool = function(name, defaultValue) {
		return Amarok.Script.readConfig(name, defaultValue ? "true" : "false") == "true";
	};

	this.loadSettings = function() {
		this.m_askDeleteConfirmation = this.loadBool("askDeleteConfirmation", true);
	};

	this.onToggleAskDeleteConfirmation = function(checked) {
		this.m_askDeleteConfirmation = checked ? true : false;

		this.saveBool("askDeleteConfirmation", this.m_askDeleteConfirmation);
	};

	// Language

	this.loadStrings = function(languageCode) {
		if(!languageCode)
		{
			return false;
		}

		return Importer.include("lang-" + languageCode.toLowerCase() + ".js");
	};

	this.getLanguageCode = function() {
		var language = QLocale.system().name();
		var index = language.lastIndexOf('_');

		if(index < 0)
		{
			return undefined;
		}

		return language.substring(0, index);
	};

	this.initStrings = function() {
		g_dcpfStrings.LANG_REMOVED_NOTFOUND = "File already removed or non existent";
		g_dcpfStrings.LANG_DELETE_CONFIRMATION = function(filename) { return "Cofirm deletion of file: " + filename; };
		g_dcpfStrings.LANG_CANNOT_DELETE = function(filename) { return "Could not delete file: " + filename; };
		g_dcpfStrings.LANG_UNKNOWN_ERROR = "Uknown error";
		g_dcpfStrings.LANG_DELETE_PLAYING_FILE_COMMAND = "Delete current playing file...";
		g_dcpfStrings.LANG_SETTINGS_MENU = "Delete Current Playing File settings";
		g_dcpfStrings.LANG_ASK_DELETE_CONFIRMATION_OPTION = "Ask for confirmation when deleting file";

		if(!this.loadStrings(QLocale.system().name()))
		{
			this.loadStrings(this.getLanguageCode());
		}
	};

	// User Interface

	this.setupMenus = function() {
		Amarok.Window.addToolsMenu("dcpfPluginAction", g_dcpfStrings.LANG_DELETE_PLAYING_FILE_COMMAND, "archive-remove");

		Amarok.Window.ToolsMenu.dcpfPluginAction['triggered()'].connect(this, this.deleteCurrentPlayingFile);

		var settingsMenu = new QMenu(g_dcpfStrings.LANG_SETTINGS_MENU);

		Amarok.Window.addSettingsMenu("dcpfPluginSettings", g_dcpfStrings.LANG_DELETE_PLAYING_FILE_COMMAND, "archive-remove");

		Amarok.Window.SettingsMenu.dcpfPluginSettings.setMenu(settingsMenu);

		var askDeleteConfirmationOption = settingsMenu.addAction(g_dcpfStrings.LANG_ASK_DELETE_CONFIRMATION_OPTION);

		askDeleteConfirmationOption.checkable = true;
		askDeleteConfirmationOption.checked = this.m_askDeleteConfirmation;
		askDeleteConfirmationOption['triggered(bool)'].connect(this, this.onToggleAskDeleteConfirmation);
	};

	// Init

	this.initStrings();
	this.initStrings = undefined;

	this.loadSettings();
	this.loadSettings = undefined;

	this.setupMenus();
	this.setupMenus = undefined;
};
