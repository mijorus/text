<?php

declare(strict_types=1);
/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Text\DAV;

use OC\Files\Node\File;
use OC\Files\Node\Folder;
use OCA\DAV\Connector\Sabre\Directory;
use OCA\DAV\Files\FilesHome;
use OCA\Text\AppInfo\Application;
use OCA\Text\Service\WorkspaceService;
use OCP\Files\IRootFolder;
use OCP\Files\StorageNotAvailableException;
use OCP\IConfig;
use Sabre\DAV\INode;
use Sabre\DAV\PropFind;
use Sabre\DAV\Server;
use Sabre\DAV\ServerPlugin;

class WorkspacePlugin extends ServerPlugin {
	public const WORKSPACE_PROPERTY = '{http://nextcloud.org/ns}rich-workspace';
	public const WORKSPACE_FILE_PROPERTY = '{http://nextcloud.org/ns}rich-workspace-file';

	/** @var Server */
	private $server;

	/** @var WorkspaceService */
	private $workspaceService;

	/**  @var IRootFolder */
	private $rootFolder;

	/** @var IConfig */
	private $config;

	/** @var string|null */
	private $userId;

	public function __construct(WorkspaceService $workspaceService, IRootFolder $rootFolder, IConfig $config, $userId) {
		$this->workspaceService = $workspaceService;
		$this->rootFolder = $rootFolder;
		$this->config = $config;
		$this->userId = $userId;
	}

	/**
	 * This initializes the plugin.
	 *
	 * This function is called by Sabre\DAV\Server, after
	 * addPlugin is called.
	 *
	 * This method should set up the required event subscriptions.
	 *
	 * @param Server $server
	 * @return void
	 */
	public function initialize(Server $server) {
		$this->server = $server;

		$this->server->on('propFind', [$this, 'propFind']);
	}


	public function propFind(PropFind $propFind, INode $node) {
		if (!in_array(self::WORKSPACE_PROPERTY, $propFind->getRequestedProperties())
			&& !in_array(self::WORKSPACE_FILE_PROPERTY, $propFind->getRequestedProperties())) {
			return;
		}

		if (!$node instanceof Directory && !$node instanceof FilesHome) {
			return;
		}

		$workspaceAvailable = $this->config->getAppValue(Application::APP_NAME, 'workspace_available', '1') === '1';
		$workspaceEnabled = $this->config->getUserValue($this->userId, Application::APP_NAME, 'workspace_enabled', '1') === '1';

		if (!$workspaceAvailable || !$workspaceEnabled) {
			return;
		}

		$file = null;
		$owner = $this->userId ?? $node->getFileInfo()->getStorage()->getOwner('');
		/** @var Folder[] $nodes */
		$nodes = $this->rootFolder->getUserFolder($owner)->getById($node->getId());
		if (count($nodes) > 0) {
			/** @var File $file */
			try {
				$file = $this->workspaceService->getFile($nodes[0]);
			} catch (StorageNotAvailableException $e) {
				// If a storage is not available we can for the propfind response assume that there is no rich workspace present
			}
		}

		// Only return the property for the parent node and ignore it for further in depth nodes
		$propFind->handle(self::WORKSPACE_PROPERTY, function () use ($file) {
			if ($file instanceof File) {
				return $file->getContent();
			}
			return '';
		});
		$propFind->handle(self::WORKSPACE_FILE_PROPERTY, function () use ($file) {
			if ($file instanceof File) {
				return $file->getFileInfo()->getId();
			}
			return '';
		});
	}
}
