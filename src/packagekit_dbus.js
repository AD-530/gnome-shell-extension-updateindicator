/* This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const DBus = imports.dbus;

const PackageKitIFace = {
    name: 'org.freedesktop.PackageKit',
    
    methods: [
    {
        name: 'CanAuthorize', 
        inSignature: 's', 
        outSignature: 's'
    },
    {
        name: 'GetTid', 
        inSignature: '', 
        outSignature: 's'
    },
    {
        name: 'GetTimeSinceAction', 
        inSignature: 's', 
        outSignature: 'u'
    },
    {
        name: 'GetTransactionList', 
        inSignature: '', 
        outSignature: 'as'
    },
    {
        name: 'StateHasChanged ', 
        inSignature: 's', 
        outSignature: ''
    },
    {
        name: 'SuggestDaemonQuit', 
        inSignature: '', 
        outSignature: ''
    },
    {
        name: 'GetDaemonState', 
        inSignature: '', 
        outSignature: 's'
    },
    {
        name: 'SetProxy', 
        inSignature: 'ssssss', 
        outSignature: ''
    },
    {
        name: 'SetRoot', 
        inSignature: 's', 
        outSignature: ''
    }
    ],
                
    signals: [
    {
        name: 'TransactionListChanged', 
        inSignature: 'as'
    },
    {
        name: 'RestartSchedule', 
        inSignature: ''
    },
    {
        name: 'RepoListChanged', 
        inSignature: ''
    },
    {
        name: 'UpdatesChanged', 
        inSignature: ''
    },

    {
        name: 'Changed', 
        inSignature: ''
    }
    ],
             
    properties: [
    {
        name : 'VersionMajor', 
        signature: 'u', 
        access: 'read'
    },
    {
        name : 'VersionMinor', 
        signature: 'u', 
        access: 'read'
    },
    {
        name : 'VersionMicro', 
        signature: 'u', 
        access: 'read'
    },
    {
        name : 'BackendName', 
        signature: 's',  
        access: 'read'
    },
    {
        name : 'BackendDescription', 
        signature: 's', 
        access: 'read'
    },
    {
        name : 'BackendAuthor', 
        signature: 's', 
        access: 'read'
    },
    {
        name : 'Roles', 
        signature: 's', 
        access: 'read'
    },
    {
        name : 'Groups', 
        signature: 's', 
        access: 'read'
    },
    {
        name : 'Filters', 
        signature: 's', 
        access: 'read'
    },
    {
        name : 'MimeTypes', 
        signature: 's', 
        access: 'read'
    },
    {
        name : 'Locked', 
        signature: 'b', 
        access: 'read'
    },
    {
        name : 'NetworkState', 
        signature: 's', 
        access: 'read'
    },
    {
        name : 'DistroId', 
        signature: 's', 
        access: 'read'
    }
    ]
};


const PackageKitTransactionIFace = {
    name: 'org.freedesktop.PackageKit.Transaction',
    
    methods: [
    {
        name: 'SetHints', 
        inSignature: 'as', 
        outSignature: ''
    },
    {
        name: 'AcceptEula', 
        inSignature: 's', 
        outSignature: ''
    },
    {
        name: 'Cancel', 
        inSignature: '', 
        outSignature: ''
    },
    {
        name: 'DownloadPackages', 
        inSignature: 'bas', 
        outSignature: ''
    },
    {
        name: 'GetCategories', 
        inSignature: '', 
        outSignature: ''
    },
    {
        name: 'GetDepends', 
        inSignature: 'sasb', 
        outSignature: ''
    },
    {
        name: 'GetDetails', 
        inSignature: 'as', 
        outSignature: ''
    },
    {
        name: 'GetFiles', 
        inSignature: 'as', 
        outSignature: ''
    },
    {
        name: 'GetOldTransactions', 
        inSignature: 'u', 
        outSignature: ''
    },
    {
        name: 'GetPackages', 
        inSignature: 's', 
        outSignature: ''
    },
    {
        name: 'GetRepoList', 
        inSignature: 's', 
        outSignature: ''
    },
    {
        name: 'GetRequires', 
        inSignature: 'sasb', 
        outSignature: ''
    },
    {
        name: 'GetUpdateDetail', 
        inSignature: 'as', 
        outSignature: ''
    },
    {
        name: 'GetUpdates', 
        inSignature: 's', 
        outSignature: ''
    },
    {
        name: 'GetDistroUpgrades', 
        inSignature: '', 
        outSignature: ''
    },
    {
        name: 'InstallFiles', 
        inSignature: 'bas', 
        outSignature: ''
    },
    {
        name: 'InstallPackages', 
        inSignature: 'bas', 
        outSignature: ''
    },
    {
        name: 'InstallSignature', 
        inSignature: 'sss', 
        outSignature: ''
    },
    {
        name: 'RefreshCache', 
        inSignature: 'b', 
        outSignature: ''
    },
    {
        name: 'RemovePackages', 
        inSignature: 'asbb', 
        outSignature: ''
    },
    {
        name: 'RepoEnable', 
        inSignature: 'sb', 
        outSignature: ''
    },
    {
        name: 'RepoSetData', 
        inSignature: 'sss', 
        outSignature: ''
    },
    {
        name: 'Resolve', 
        inSignature: 'sas', 
        outSignature: ''
    },
    {
        name: 'Rollback', 
        inSignature: 's', 
        outSignature: ''
    },
    {
        name: 'SearchDetails', 
        inSignature: 'sas', 
        outSignature: ''
    },
    {
        name: 'SearchFiles', 
        inSignature: 'sas', 
        outSignature: ''
    },
    {
        name: 'SearchGroups', 
        inSignature: 'sas', 
        outSignature: ''
    },
    {
        name: 'SearchNames', 
        inSignature: 'sas', 
        outSignature: ''
    },
    {
        name: 'SimulateInstallFiles', 
        inSignature: 'as', 
        outSignature: ''
    },
    {
        name: 'SimulateInstallPackages', 
        inSignature: 'as', 
        outSignature: ''
    },
    {
        name: 'SimulateRemovePackages', 
        inSignature: 'asb', 
        outSignature: ''
    },
    {
        name: 'SimulateUpdatePackages', 
        inSignature: 'as', 
        outSignature: ''
    },
    {
        name: 'UpdatePackages', 
        inSignature: 'bas', 
        outSignature: ''
    },
    {
        name: 'UpdateSystem', 
        inSignature: 'b', 
        outSignature: ''
    },
    {
        name: 'WhatProvides', 
        inSignature: 'ssas', 
        outSignature: ''
    },
    {
        name: 'UpgradeSystem', 
        inSignature: 'ss', 
        outSignature: ''
    }
    ],
                
    signals: [
    {
        name: 'Category', 
        inSignature: 'sssss'
    },
    {
        name: 'Details', 
        inSignature: 'ssssst'
    },
    {
        name: 'ErrorCode', 
        inSignature: 'ss'
    },
    {
        name: 'Files', 
        inSignature: 'ss'
    },
    {
        name: 'Finished', 
        inSignature: 'su'
    },
    {
        name: 'Message', 
        inSignature: 'ss'
    },
    {
        name: 'Package', 
        inSignature: 'sss'
    },
    {
        name: 'RepoDetail', 
        inSignature: 'ssb'
    },
    {
        name: 'RepoSignatureRequired', 
        inSignature: 'ssssssss'
    },
    {
        name: 'EulaRequired', 
        inSignature: 'ssss'
    },
    {
        name: 'MediaChangeRequired', 
        inSignature: 'sss'
    },
    {
        name: 'RequireRestart', 
        inSignature: 'ss'
    },
    {
        name: 'Transaction', 
        inSignature: 'ssbsusus'
    },
    {
        name: 'UpdateDetail', 
        inSignature: 'ssssssssssss'
    },
    {
        name: 'DistroUpgrade', 
        inSignature: 'sss'
    },
    {
        name: 'Changed', 
        inSignature: ''
    },
    {
        name: 'ItemProgress', 
        inSignature: 'suu'
    },
    {
        name: 'Destroy', 
        inSignature: ''
    }
    ],
             
    properties: [
    {
        name : 'Role', 
        signature: 's', 
        access: 'read'
    },
    {
        name : 'Status', 
        signature: 's', 
        access: 'read'
    },
    {
        name : 'LastPackage', 
        signature: 's', 
        access: 'read'
    },
    {
        name : 'Uid', 
        signature: 'u', 
        access: 'read'
    },
    {
        name : 'Percentage', 
        signature: 'u', 
        access: 'read'
    },
    {
        name : 'Subpercentage',         
        signature: 'u',         
        access: 'read'
    },
    {
        name : 'AllowCancel', 
        signature: 'b', 
        access: 'read'
    },
    {
        name : 'CallerActive', 
        signature: 'b', 
        access: 'read'
    },
    {
        name : 'ElapsedTime', 
        signature: 'u', 
        access: 'read'
    },
    {
        name : 'RemainingTime', 
        signature: 'u', 
        access: 'read'
    },
    {
        name : 'Speed',         
        signature: 'u',         
        access: 'read'
    }
    ]
};
