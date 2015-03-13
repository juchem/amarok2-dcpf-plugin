#!/bin/sh

# Delete Current Playing File plugin for Amarok 2
# Copyright (C) 2011 Marcelo Juchem
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

set -e

if [ -z "$1" ]; then
	echo "ERROR: Version not specified"
	echo
	echo "Usage: $(basename "${0}") version"
	exit 1
fi

plugin_shortname="dcpf"
plugin_version="$1"
plugin_friendlyname="${plugin_shortname}-${plugin_version}"
tmp_dir="${plugin_friendlyname}"
dist_dir="dist"
src_dir="src"
version_placeholder="VERSION_PLACEHOLDER"
spec_file="script.spec"
spec_deploy_path="${tmp_dir}/${spec_file}"
scripts_extension="js"
package_suffix=".amarokscript.tar.bz2"
package_file="${plugin_friendlyname}${package_suffix}"
package_path="${dist_dir}/${package_file}"
license_file="LICENSE"
license_deploy_path="${tmp_dir}/${license_file}"

if [ ! -d "${src_dir}" ]; then
	echo "ERROR: Source directory not found"
	exit -1
fi

if [ -d "${tmp_dir}" ]; then
	echo "Removing old temporary directory: ${tmp_dir}..."
	rm -rf "${tmp_dir}"
fi

echo "Creating temporary directory: ${tmp_dir}..."
mkdir "${tmp_dir}"

echo
echo "Deploying license file: ${license_deploy_path}..."
cp "${license_file}" "${license_deploy_path}"

echo
echo "Processing and deploying plugin specification file ${spec_file} to ${spec_deploy_path}..."
sed "${src_dir}/${spec_file}" -e "s/${version_placeholder}/${plugin_version}/" > "${spec_deploy_path}"

echo
echo "Processing script files..."
# TODO: Fix this - spaces are currently not allowed in ${src_dir} and ${scripts_extension}
for script_file in ${src_dir}/*.${scripts_extension}; do
	script_filename="$(basename ${script_file})"
	script_deploy_path="${tmp_dir}/${script_filename}"

	echo "Deploying ${script_filename} to ${script_deploy_path}..."
	cp "${script_file}" "${script_deploy_path}"
done

echo
if [ ! -d "${dist_dir}" ]; then
	echo "Creating distribution directory..."
	mkdir "${dist_dir}"
fi

if [ -e "${package_path}" ]; then
	echo "Removing old plugin package: ${package_path}..."
	rm -f "${package_path}"
fi

echo
echo "Packaging plugin: ${package_path}..."
# TODO: Fix this - spaces are currently not allowed in ${tmp_dir}
tar cjvf "${package_path}" ${tmp_dir}/*

echo
echo "Successfully created package ${plugin_version} at ${package_path}"
