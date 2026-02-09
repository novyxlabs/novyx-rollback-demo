#!/usr/bin/env node
/**
 * Memory Time Travel
 * 
 * Travel back in your agent's memory to see what it knew at any point in time.
 * Uses Novyx rollback preview (dry_run=True) to show past state without changing anything.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class MemoryTimeTravel {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.NOVYX_API_KEY;
    this.apiUrl = config.apiUrl || process.env.NOVYX_API_URL || 'https://novyx-ram-api.fly.dev';
    
    if (!this.apiKey) {
      console.warn('⚠️ MemoryTimeTravel: NOVYX_API_KEY not set');
    }
    
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Get memories that existed at a specific timestamp
   * @param {string} isoTimestamp - ISO 8601 timestamp
   * @returns {Object} - Memories at that time
   */
  async getMemoryAt(isoTimestamp) {
    if (!this.apiKey) {
      return { error: 'No API key configured' };
    }
    
    try {
      // Use rollback dry_run to preview what memories would be restored
      // Note: params are query params, not body
      const response = await axios.post(
        `${this.apiUrl}/v1/memories/rollback`,
        {},
        {
          params: {
            target_timestamp: isoTimestamp,
            dry_run: 'true'
          },
          headers: this.headers
        }
      );
      
      return {
        timestamp: isoTimestamp,
        ...response.data
      };
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 403 || status === 429) {
          return {
            error: 'Upgrade required',
            message: 'Rollback preview requires Pro tier',
            upgrade_url: 'https://novyxlabs.com/pricing'
          };
        }
        return { error: `API Error (${status})`, details: error.response.data };
      }
      return { error: error.message };
    }
  }
  
  /**
   * Compare memory state between two timestamps
   * @param {string} fromTimestamp - Start time
   * @param {string} toTimestamp - End time (defaults to now)
   */
  async compare(fromTimestamp, toTimestamp = null) {
    const toTime = toTimestamp || new Date().toISOString();
    
    const [fromResult, toResult] = await Promise.all([
      this.getMemoryAt(fromTimestamp),
      this.getMemoryAt(toTime)
    ]);
    
    return {
      from: fromTimestamp,
      to: toTime,
      from_memories: fromResult.artifacts_affected || 0,
      to_memories: toResult.artifacts_affected || 0,
      difference: (toResult.artifacts_affected || 0) - (fromResult.artifacts_affected || 0)
    };
  }
  
  /**
   * Search memories from a specific time period
   * @param {string} query - Search query
   * @param {string} since - ISO timestamp
   */
  async searchSince(query, since) {
    if (!this.apiKey) {
      return { error: 'No API key configured' };
    }
    
    try {
      // Get memories from the past
      const past = await this.getMemoryAt(since);
      
      // Search within those memories
      const response = await axios.get(
        `${this.apiUrl}/v1/memories/search`,
        {
          params: { q: query, limit: 10 },
          headers: this.headers }
      );
      
      return {
        query,
        since,
        memories_at_time: past,
        search_results: response.data.memories || []
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  /**
   * Format time travel result for display
   */
  formatResult(result) {
    if (result.error) {
      return `❌ Error: ${result.error}`;
    }
    
    // Handle upgrade required
    if (result.error === 'Upgrade required') {
      return `⚠️ Upgrade Required\n\n${result.message || 'Rollback preview requires Pro tier'}\nUpgrade: ${result.upgrade_url || 'https://novyxlabs.com/pricing'}`;
    }
    
    const lines = [
      `🕐 Target: ${result.target_timestamp || result.timestamp || 'unknown'}`,
      `━━━━━━━━━━━━━━━━━━━━━`
    ];
    
    if (result.artifacts_affected !== undefined) {
      lines.push(`📦 Would restore: ${result.artifacts_restored || 0} memories`);
      lines.push(`🗑️ Would remove: ${result.artifacts_removed || 0} memories`);
      lines.push(`📊 Total: ${result.artifacts_affected} artifacts`);
    }
    
    if (result.details && result.details.length > 0) {
      lines.push(`\n📋 Details:`);
      result.details.forEach(d => {
        lines.push(`  • ${d.action}: ${d.observation?.substring(0, 60)}...`);
      });
    }
    
    if (result.errors && result.errors.length > 0) {
      lines.push(`\n⚠️ Warnings: ${result.errors.join(', ')}`);
    }
    
    // Show message if no artifacts
    if (result.artifacts_affected === 0) {
      lines.push(`\n💡 No memories to restore.`);
      lines.push(`   Add memories with nx.remember() first.`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * CLI entry point
   */
  async cli() {
    const args = require('minimist')(process.argv.slice(2));
    
    if (args.h || args.help) {
      console.log(`
Memory Time Travel 🕐

Usage:
  node time_travel.js --timestamp "2026-02-09T14:00:00Z"
  node time_travel.js --hours-ago 2
  node time_travel.js --compare --from "2026-02-09T10:00:00Z"
  node time_travel.js --search "database" --since "2026-02-09T12:00:00Z"

Options:
  --timestamp, -t    ISO timestamp to travel to
  --hours-ago, -h   Hours ago (alternative to timestamp)
  --compare, -c     Compare two timestamps
  --from            Start time for comparison
  --search, -s      Search query
  --since           Time for search
  --help, -h        Show this help
`);
      return;
    }
    
    let targetTime;
    
    // minimist returns dashed args as {'hours-ago': value}
    const hoursAgo = args['hours-ago'] || args.h;
    const timestamp = args.timestamp || args.t;
    const compare = args.compare || args.c;
    const fromTime = args.from;
    const search = args.search || args.s;
    const since = args.since;
    
    if (hoursAgo) {
      const hours = parseInt(hoursAgo);
      targetTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    } else if (timestamp) {
      targetTime = timestamp;
    } else if (search && since) {
      // Search mode
      const result = await this.searchSince(search, since);
      console.log(this.formatResult(result));
      return;
    } else {
      console.log('❌ Error: Provide --timestamp or --hours-ago');
      console.log('   Run with --help for usage');
      return;
    }
    
    console.log(`🕐 Traveling to: ${targetTime}\n`);
    
    if (compare) {
      const from = fromTime || new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const result = await this.compare(from, targetTime);
      console.log(this.formatResult(result));
    } else {
      const result = await this.getMemoryAt(targetTime);
      console.log(this.formatResult(result));
    }
  }
}

// Export for use as module
module.exports = MemoryTimeTravel;

// CLI run
if (require.main === module) {
  const traveler = new MemoryTimeTravel();
  traveler.cli();
}
